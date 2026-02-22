import { motion } from "framer-motion";

const PlaceholderPage = ({ title, description }: { title: string; description: string }) => (
  <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      <p className="mt-1 text-muted-foreground">{description}</p>
    </motion.div>
    <motion.div
      className="mt-8 glass-card flex items-center justify-center p-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <p className="text-muted-foreground text-sm">This section is being built. Check back soon!</p>
    </motion.div>
  </div>
);

// Teacher sub-pages
export const TeacherExams = () => (
  <PlaceholderPage title="Exam Management" description="Create, schedule, and manage exams with AI-powered question generation." />
);
export const TeacherGrievances = () => (
  <PlaceholderPage title="Grievance Management" description="Review and resolve student grievances and re-evaluate submissions." />
);
export const TeacherAnalytics = () => (
  <PlaceholderPage title="Class Analytics" description="View class-wise performance reports, averages, and rankings." />
);

// Student sub-pages
export const StudentExams = () => (
  <PlaceholderPage title="My Exams" description="View scheduled and completed exams." />
);
export const StudentGrievances = () => (
  <PlaceholderPage title="My Grievances" description="File and track grievance status for evaluations." />
);

