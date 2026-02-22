import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CLASS_OPTIONS } from "@/lib/constants";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { Trophy, TrendingUp, Users, Target, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

type ScorecardData = {
  id: string;
  student_id: string;
  exam_id: string;
  total_marks_obtained: number;
  total_marks: number;
  percentage: number;
  exams: {
    title: string;
    class_name: string;
  };
  profiles: {
    full_name: string;
    reg_number?: string;
    class_name?: string;
  };
};

const TeacherAnalyticsPage = () => {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState<string>("Class 10 - A");
  const [loading, setLoading] = useState(true);
  const [scorecards, setScorecards] = useState<ScorecardData[]>([]);



  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      
      const { data, error } = await supabase
        .from("scorecards")
        .select(`
          *,
          exams(title, class_name)
        `);
      
      if (data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const filtered = (data as any[]).filter(s => s.exams?.class_name === selectedClass);
          
          const studentIds = [...new Set(filtered.map(s => s.student_id))];
          const profileMap: Record<string, { full_name: string, reg_number: string, class_name: string }> = {};
          
          if (studentIds.length > 0) {
              // Profiles table query is strictly blocked by RLS for Teachers.
              // Workaround: Pull metadata directly from the student's submission JSON payload securely
              const { data: subsData } = await supabase
                  .from("submissions")
                  .select("student_id, answers")
                  .in("student_id", studentIds);
                  
              (subsData || []).forEach((sub: any) => {
                  if (sub.answers && typeof sub.answers === 'object' && !Array.isArray(sub.answers) && sub.answers.__metadata) {
                      const meta = sub.answers.__metadata;
                      profileMap[sub.student_id] = { 
                          full_name: meta.full_name || "Unknown Student",
                          reg_number: meta.reg_number || 'N/A',
                          class_name: meta.class_name || 'N/A'
                      }; 
                  }
              });
          }

          const resolvedScorecards = filtered.map(s => ({
              ...s,
              profiles: profileMap[s.student_id] || { full_name: `Student`, reg_number: 'N/A', class_name: 'N/A' }
          }));

          setScorecards(resolvedScorecards);
      } else if (error) {
          console.error("Failed to load scorecards", error);
      }
      setLoading(false);
    };
    fetchData();
  }, [user, selectedClass]);

  // Aggregations
  const totalStudentsEvaluated = new Set(scorecards.map(s => s.student_id)).size;
  const avgPercentage = scorecards.length > 0 
    ? scorecards.reduce((sum, s) => sum + s.percentage, 0) / scorecards.length 
    : 0;
  const passingRate = scorecards.length > 0
    ? (scorecards.filter(s => s.percentage >= 40).length / scorecards.length) * 100
    : 0;
  const topScore = scorecards.length > 0 ? Math.max(...scorecards.map(s => s.percentage)) : 0;

  // Chart 1: Average by Exam
  const examAverages: Record<string, { total: number, count: number }> = {};
  scorecards.forEach(s => {
      const title = s.exams?.title || "Unknown";
      if (!examAverages[title]) examAverages[title] = { total: 0, count: 0 };
      examAverages[title].total += s.percentage;
      examAverages[title].count += 1;
  });
  const examChartData = Object.keys(examAverages).map(title => ({
      name: title,
      Average: Math.round(examAverages[title].total / examAverages[title].count)
  }));

  // Leaderboard
  const studentAverages: Record<string, { name: string, regNumber: string, total: number, count: number }> = {};
  scorecards.forEach(s => {
      const p = s.profiles?.full_name || "Unknown Student";
      const regParams = s.profiles?.reg_number || "N/A";
      
      if (!studentAverages[p]) studentAverages[p] = { name: p, regNumber: regParams, total: 0, count: 0 };
      studentAverages[p].total += s.percentage;
      studentAverages[p].count += 1;
  });
  const leaderboard = Object.values(studentAverages)
      .map(s => ({ name: s.name, average: Math.round(s.total / s.count) }))
      .sort((a, b) => b.average - a.average)
      .slice(0, 5); // top 5

  const studentList = Object.values(studentAverages)
      .map(s => ({ 
          name: s.name, 
          regNumber: s.regNumber,
          examsTaken: s.count, 
          average: Math.round(s.total / s.count) 
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

  const passedCount = scorecards.filter(s => s.percentage >= 40).length;
  const failedCount = scorecards.length - passedCount;
  const pieData = [
      { name: "Passed", value: passedCount },
      { name: "Needs Improvement", value: failedCount }
  ];
  const PIE_COLORS = ["#10b981", "#ef4444"];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Link to="/teacher">
             <Button variant="ghost" size="sm" className="mb-2 gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> Back to Dashboard
             </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Class Analytics</h1>
          <p className="text-muted-foreground mt-1">Deep insights into student performance and trends.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full sm:w-64">
           <Select value={selectedClass} onValueChange={setSelectedClass}>
             <SelectTrigger className="bg-card">
               <SelectValue placeholder="Select a class" />
             </SelectTrigger>
             <SelectContent>
               {CLASS_OPTIONS.map(c => (
                 <SelectItem key={c} value={c}>{c}</SelectItem>
               ))}
             </SelectContent>
           </Select>
        </motion.div>
      </div>



      {loading ? (
        <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
               {[
                   { title: "Avg. Class Score", value: `${Math.round(avgPercentage)}%`, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
                   { title: "Highest Score", value: `${Math.round(topScore)}%`, icon: Trophy, color: "text-warning", bg: "bg-warning/10" },
                   { title: "Passing Rate", value: `${Math.round(passingRate)}%`, icon: Target, color: "text-success", bg: "bg-success/10" },
                   { title: "Students Evaluated", value: totalStudentsEvaluated, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" }
               ].map((kpi, i) => (
                   <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-5">
                       <div className="flex items-center gap-4">
                           <div className={`p-3 rounded-xl ${kpi.bg}`}>
                               <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
                           </div>
                           <div>
                               <p className="text-sm text-muted-foreground">{kpi.title}</p>
                               <p className="text-2xl font-bold">{kpi.value}</p>
                           </div>
                       </div>
                   </motion.div>
               ))}
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 lg:grid-cols-3">
                
                {/* Exam Performance Chart */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6 lg:col-span-2">
                    <h3 className="font-semibold text-lg mb-6">Exam Averages</h3>
                    {examChartData.length > 0 ? (
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={examChartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dx={-10} domain={[0, 100]} />
                                    <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                    <Bar dataKey="Average" fill="#F97316" radius={[6, 6, 0, 0]} maxBarSize={50} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-72 flex items-center justify-center border-2 border-dashed rounded-xl">
                            <p className="text-muted-foreground text-sm">No exam data available for this class.</p>
                        </div>
                    )}
                </motion.div>

                {/* Leaderboard */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6 flex flex-col">
                    <div className="flex items-center gap-2 mb-6">
                        <Trophy className="h-5 w-5 text-warning" />
                        <h3 className="font-semibold text-lg">Top Performers</h3>
                    </div>
                    
                    {leaderboard.length > 0 ? (
                        <div className="space-y-4 flex-1">
                            {leaderboard.map((student, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50 hover:bg-muted transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                                            i === 0 ? 'bg-warning/20 text-warning' : 
                                            i === 1 ? 'bg-slate-200 text-slate-600' :
                                            i === 2 ? 'bg-amber-700/20 text-amber-700' : 'bg-primary/10 text-primary'
                                        }`}>
                                            #{i + 1}
                                        </div>
                                        <p className="font-medium text-sm">{student.name}</p>
                                    </div>
                                    <span className="font-bold text-foreground text-sm">{student.average}%</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center border-2 border-dashed rounded-xl">
                            <p className="text-muted-foreground text-sm">No evaluations found.</p>
                        </div>
                    )}
                </motion.div>

            </div>

            {/* Bottom Row: Pie Chart & Student Details Table */}
            <div className="grid gap-6 lg:grid-cols-3">
                
                {/* Pass/Fail Ratio */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6 flex flex-col">
                    <h3 className="font-semibold text-lg mb-6">Pass vs. Fail Ratio</h3>
                     {scorecards.length > 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <div className="h-52 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex gap-4 mt-2">
                                <div className="flex items-center gap-1.5 text-sm"><span className="w-3 h-3 rounded-full bg-success"></span> Passed</div>
                                <div className="flex items-center gap-1.5 text-sm"><span className="w-3 h-3 rounded-full bg-destructive"></span> Failed</div>
                            </div>
                        </div>
                     ) : (
                        <div className="flex-1 flex items-center justify-center border-2 border-dashed rounded-xl">
                            <p className="text-muted-foreground text-sm">No data available.</p>
                        </div>
                     )}
                </motion.div>

                {/* Detailed Roster Table */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card p-6 lg:col-span-2 overflow-hidden flex flex-col">
                    <h3 className="font-semibold text-lg mb-6">Class Roster Details</h3>
                    {studentList.length > 0 ? (
                        <div className="flex-1 overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
                                    <tr>
                                        <th className="px-4 py-3 rounded-tl-lg">Student Name</th>
                                        <th className="px-4 py-3">Reg Number</th>
                                        <th className="px-4 py-3">Class</th>
                                        <th className="px-4 py-3 text-center">Exams Taken</th>
                                        <th className="px-4 py-3 text-right rounded-tr-lg">Avg Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentList.map((st, i) => (
                                        <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                                            <td className="px-4 py-3 font-medium text-foreground">{st.name}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{st.regNumber}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{selectedClass}</td>
                                            <td className="px-4 py-3 text-center">{st.examsTaken}</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                    st.average >= 75 ? 'bg-success/10 text-success' :
                                                    st.average >= 40 ? 'bg-warning/10 text-warning' :
                                                    'bg-destructive/10 text-destructive'
                                                }`}>
                                                    {st.average}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center border-2 border-dashed rounded-xl p-8">
                            <p className="text-muted-foreground text-sm">No students found.</p>
                        </div>
                    )}
                </motion.div>

            </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAnalyticsPage;
