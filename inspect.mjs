import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://aheqpwajbrwbulyfwqzr.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoZXFwd2FqYnJ3YnVseWZ3cXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NzAwMjYsImV4cCI6MjA4NzI0NjAyNn0.oSlt42qBSHpqjCH4arNGme9B6Je6mr988CrXyFVxwJk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectExams() {
    const { data: exams, error } = await supabase.from('exams').select('*').limit(10);
    console.log("Exams:");
    console.table(exams.map(e => ({ id: e.id, title: e.title, status: e.status })));

    if (exams.length > 0) {
        for (let exam of exams) {
            const { data: questions } = await supabase.from('questions').select('*').eq('exam_id', exam.id);
            console.log(`Exam ${exam.title} (${exam.id}) has ${questions?.length} questions.`);
            if (questions && questions.length > 0) {
                console.log(`Question types for this exam:`, questions.map(q => q.question_type));
            }
        }
    }

    const { data: qData } = await supabase.from('questions').select('*');
    console.log(`Total questions in DB: ${qData?.length}`);
}

inspectExams();
