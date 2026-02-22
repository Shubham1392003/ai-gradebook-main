-- Fix the RLS policy on the questions table to allow viewing questions for scheduled exams that are live.
DROP POLICY IF EXISTS "Students can view questions for active exams" ON public.questions;

CREATE POLICY "Students can view questions for active exams" ON public.questions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.exams 
    WHERE exams.id = questions.exam_id 
    AND (
      exams.status IN ('active', 'completed') OR
      (exams.status = 'scheduled' AND exams.scheduled_at <= now())
    )
  )
);
