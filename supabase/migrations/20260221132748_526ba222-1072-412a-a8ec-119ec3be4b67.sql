
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('teacher', 'student');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own role on signup" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Exams table
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  class_name TEXT NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 60,
  total_marks INT NOT NULL DEFAULT 100,
  warning_limit INT NOT NULL DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'completed')),
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage own exams" ON public.exams FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Students can view active exams" ON public.exams FOR SELECT USING (status IN ('scheduled', 'active', 'completed'));

-- Questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'short_answer' CHECK (question_type IN ('mcq', 'short_answer', 'long_answer', 'true_false')),
  options JSONB,
  correct_answer TEXT,
  marks INT NOT NULL DEFAULT 1,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage questions" ON public.questions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.exams WHERE exams.id = questions.exam_id AND exams.teacher_id = auth.uid())
);
CREATE POLICY "Students can view questions for active exams" ON public.questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.exams WHERE exams.id = questions.exam_id AND exams.status IN ('active', 'completed'))
);

-- Submissions table
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  warning_count INT NOT NULL DEFAULT 0,
  is_terminated BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'terminated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (exam_id, student_id)
);
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can manage own submissions" ON public.submissions FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Teachers can view submissions for own exams" ON public.submissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.exams WHERE exams.id = submissions.exam_id AND exams.teacher_id = auth.uid())
);

-- Evaluations table
CREATE TABLE public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  marks_obtained NUMERIC(5,2) NOT NULL DEFAULT 0,
  ai_explanation TEXT,
  teacher_remarks TEXT,
  is_ai_evaluated BOOLEAN NOT NULL DEFAULT true,
  is_teacher_reviewed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage evaluations" ON public.evaluations FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.submissions s
    JOIN public.exams e ON e.id = s.exam_id
    WHERE s.id = evaluations.submission_id AND e.teacher_id = auth.uid()
  )
);
CREATE POLICY "Students can view own evaluations" ON public.evaluations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.submissions WHERE submissions.id = evaluations.submission_id AND submissions.student_id = auth.uid())
);

-- Grievances table
CREATE TABLE public.grievances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rechecked', 'resolved', 'rejected')),
  teacher_response TEXT,
  updated_marks JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.grievances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can manage own grievances" ON public.grievances FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Teachers can view/update grievances for own exams" ON public.grievances FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.submissions s
    JOIN public.exams e ON e.id = s.exam_id
    WHERE s.id = grievances.submission_id AND e.teacher_id = auth.uid()
  )
);

-- Cheating logs table
CREATE TABLE public.cheating_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('tab_switch', 'window_blur', 'face_absent', 'multiple_faces', 'audio_detected', 'inactivity', 'screenshot', 'other')),
  description TEXT,
  evidence_url TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.cheating_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can insert own cheating logs" ON public.cheating_logs FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Teachers can view cheating logs for own exams" ON public.cheating_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.submissions s
    JOIN public.exams e ON e.id = s.exam_id
    WHERE s.id = cheating_logs.submission_id AND e.teacher_id = auth.uid()
  )
);

-- Scorecards table
CREATE TABLE public.scorecards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  total_marks_obtained NUMERIC(5,2) NOT NULL DEFAULT 0,
  total_marks NUMERIC(5,2) NOT NULL DEFAULT 0,
  percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  grade TEXT,
  sgpa NUMERIC(4,2),
  cgpa NUMERIC(4,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, exam_id)
);
ALTER TABLE public.scorecards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view own scorecards" ON public.scorecards FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Teachers can manage scorecards" ON public.scorecards FOR ALL USING (
  EXISTS (SELECT 1 FROM public.exams WHERE exams.id = scorecards.exam_id AND exams.teacher_id = auth.uid())
);

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add update triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON public.exams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON public.evaluations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_grievances_updated_at BEFORE UPDATE ON public.grievances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for evidence
INSERT INTO storage.buckets (id, name, public) VALUES ('evidence', 'evidence', false);
CREATE POLICY "Users can upload evidence" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'evidence' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Teachers can view evidence" ON storage.objects FOR SELECT USING (bucket_id = 'evidence');
