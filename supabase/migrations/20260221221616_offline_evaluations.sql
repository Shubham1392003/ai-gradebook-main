-- Create a storage bucket for PDFs if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pdf_uploads', 'pdf_uploads', true) 
ON CONFLICT (id) DO NOTHING;

-- Configure storage RLS (Requires manual activation of storage if not available, but tries to establish policy)
CREATE POLICY "Anyone can view pdfs" ON storage.objects FOR SELECT USING (bucket_id = 'pdf_uploads');
CREATE POLICY "Authenticated users can upload pdfs" ON storage.objects FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND bucket_id = 'pdf_uploads');

CREATE TABLE offline_evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  class_name TEXT NOT NULL,
  registration_id TEXT NOT NULL,
  question_paper_url TEXT,
  answer_sheet_url TEXT,
  extracted_questions JSONB,
  evaluation_results JSONB,
  total_marks_obtained NUMERIC DEFAULT 0,
  max_marks NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE offline_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view their own offline evaluations"
  ON offline_evaluations FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert offline evaluations"
  ON offline_evaluations FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own offline evaluations"
  ON offline_evaluations FOR UPDATE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own offline evaluations"
  ON offline_evaluations FOR DELETE
  USING (auth.uid() = teacher_id);
