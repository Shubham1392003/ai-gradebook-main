import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://aheqpwajbrwbulyfwqzr.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoZXFwd2FqYnJ3YnVseWZ3cXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NzAwMjYsImV4cCI6MjA4NzI0NjAyNn0.oSlt42qBSHpqjCH4arNGme9B6Je6mr988CrXyFVxwJk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    // get a user
    const { data: users, error: uErr } = await supabase.from('profiles').select('*').limit(1);
    if (uErr) {
        console.error("user fetching error", uErr);
        return;
    }
    const teacherId = users[0].user_id;

    // insert exam
    const { data: exam, error: examErr } = await supabase.from('exams').insert({
        title: 'Test Exam Insert',
        subject: 'Math',
        class_name: 'CS',
        teacher_id: teacherId,
        duration_minutes: 60,
        total_marks: 2,
        status: "draft",
    }).select().single();

    if (examErr) {
        console.error("Exam insertion failed", examErr);
        return;
    }

    console.log("Exam inserted successfully. ID:", exam.id);

    // insert question
    const qInserts = [
        {
            exam_id: exam.id,
            question_text: "Test question",
            question_type: "mcq",
            options: ["A", "B", "C", "D"],
            correct_answer: "A",
            marks: 2,
            order_index: 0,
        }
    ];

    const { data: qData, error: qErr } = await supabase.from('questions').insert(qInserts).select();
    if (qErr) {
        console.error("Question insertion failed", qErr);
    } else {
        console.log("Question inserted successfully", qData);
    }

    // clean up
    await supabase.from('exams').delete().eq('id', exam.id);
    console.log("Cleanup done.");
}

testInsert();
