import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://aheqpwajbrwbulyfwqzr.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoZXFwd2FqYnJ3YnVseWZ3cXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NzAwMjYsImV4cCI6MjA4NzI0NjAyNn0.oSlt42qBSHpqjCH4arNGme9B6Je6mr988CrXyFVxwJk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQuestions() {
    const { data: questions, error } = await supabase.from('questions').select('*');
    if (error) {
        console.error("Error fetching questions:", error);
        return;
    }
    console.log(`Found ${questions.length} questions in the database.`);
    console.dir(questions.map(q => ({
        id: q.id,
        exam_id: q.exam_id,
        question_text: q.question_text.substring(0, 50) + "...",
        type: q.question_type,
        marks: q.marks
    })), { depth: null });
}

checkQuestions();
