import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import DocsPage from "@/pages/DocsPage";
import TeacherDashboard from "@/pages/teacher/TeacherDashboard";
import TeacherExamsPage from "@/pages/teacher/TeacherExamsPage";
import TeacherSubmissionsPage from "@/pages/teacher/TeacherSubmissionsPage";
import TeacherEvidencePage from "@/pages/teacher/TeacherEvidencePage";
import TeacherEvaluatePage from "@/pages/teacher/TeacherEvaluatePage";
import AIQuestionGeneratorPage from "@/pages/teacher/AIQuestionGeneratorPage";
import StudentDashboard from "@/pages/student/StudentDashboard";
import StudentExamsPage from "@/pages/student/StudentExamsPage";
import ExamTakingPage from "@/pages/student/ExamTakingPage";
import StudentEvaluatedPaperPage from "@/pages/student/StudentEvaluatedPaperPage";
import StudentScorecardsPage from "@/pages/student/StudentScorecardsPage";
import {
  TeacherAnalytics,
  StudentAnalytics,
} from "@/pages/SubPages";
import TeacherGrievancesPage from "@/pages/teacher/TeacherGrievancesPage";
import StudentGrievancesPage from "@/pages/student/StudentGrievancesPage";
import { Sparkles } from "lucide-react";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const LoadingScreen = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-hero-bg gap-4">
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
      <Sparkles className="h-6 w-6 text-hero-fg animate-pulse" />
    </div>
    <p className="text-hero-muted text-sm font-medium animate-pulse">Loading FairGrade AI...</p>
  </div>
);

const HomeRedirect = () => {
  const { user, role, loading } = useAuth();
  if (loading || (user && !role)) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  return <Navigate to={role === "teacher" ? "/teacher" : "/student"} replace />;
};

const AppRoutes = () => (
  <>
    <Navbar />
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<HomeRedirect />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/docs" element={<DocsPage />} />

      {/* Teacher routes */}
      <Route path="/teacher" element={<ProtectedRoute allowedRole="teacher"><TeacherDashboard /></ProtectedRoute>} />
      <Route path="/teacher/exams" element={<ProtectedRoute allowedRole="teacher"><TeacherExamsPage /></ProtectedRoute>} />
      <Route path="/teacher/exam/:examId/submissions" element={<ProtectedRoute allowedRole="teacher"><TeacherSubmissionsPage /></ProtectedRoute>} />
      <Route path="/teacher/evidence/:submissionId" element={<ProtectedRoute allowedRole="teacher"><TeacherEvidencePage /></ProtectedRoute>} />
      <Route path="/teacher/evaluate/:submissionId" element={<ProtectedRoute allowedRole="teacher"><TeacherEvaluatePage /></ProtectedRoute>} />
      <Route path="/teacher/generate" element={<ProtectedRoute allowedRole="teacher"><AIQuestionGeneratorPage /></ProtectedRoute>} />
      <Route path="/teacher/grievances" element={<ProtectedRoute allowedRole="teacher"><TeacherGrievancesPage /></ProtectedRoute>} />
      <Route path="/teacher/analytics" element={<ProtectedRoute allowedRole="teacher"><TeacherAnalytics /></ProtectedRoute>} />

      {/* Student routes */}
      <Route path="/student" element={<ProtectedRoute allowedRole="student"><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/exams" element={<ProtectedRoute allowedRole="student"><StudentExamsPage /></ProtectedRoute>} />
      <Route path="/student/exam/:examId" element={<ProtectedRoute allowedRole="student"><ExamTakingPage /></ProtectedRoute>} />
      <Route path="/student/exam/:examId/results" element={<ProtectedRoute allowedRole="student"><StudentEvaluatedPaperPage /></ProtectedRoute>} />
      <Route path="/student/grievances" element={<ProtectedRoute allowedRole="student"><StudentGrievancesPage /></ProtectedRoute>} />
      <Route path="/student/scorecards" element={<ProtectedRoute allowedRole="student"><StudentScorecardsPage /></ProtectedRoute>} />
      <Route path="/student/analytics" element={<ProtectedRoute allowedRole="student"><StudentAnalytics /></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  </>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
