import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://aheqpwajbrwbulyfwqzr.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoZXFwd2FqYnJ3YnVseWZ3cXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NzAwMjYsImV4cCI6MjA4NzI0NjAyNn0.oSlt42qBSHpqjCH4arNGme9B6Je6mr988CrXyFVxwJk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function clearEmptyExams() {
    const { data: exams, error } = await supabase.from('exams').select('id, title');

    if (exams) {
        for (const exam of exams) {
            const { count } = await supabase.from('questions').select('*', { count: 'exact', head: true }).eq('exam_id', exam.id);

            if (count === 0) {
                console.log(`Deleting broken empty exam: ${exam.title} (ID: ${exam.id})`);
                await supabase.from('exams').delete().eq('id', exam.id);
            }
        }
    }
}

clearEmptyExams();
