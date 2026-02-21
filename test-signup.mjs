import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://aheqpwajbrwbulyfwqzr.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoZXFwd2FqYnJ3YnVseWZ3cXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NzAwMjYsImV4cCI6MjA4NzI0NjAyNn0.oSlt42qBSHpqjCH4arNGme9B6Je6mr988CrXyFVxwJk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignup() {
    const email = `test-teacher-${Date.now()}@example.com`;

    const { data, error } = await supabase.auth.signUp({
        email,
        password: 'password123',
        options: {
            data: { full_name: 'Test Teacher' }
        }
    });

    if (error) {
        console.error('Signup error:', error);
        return;
    }

    console.log('Signup success.');
    console.log('Has Session?', !!data.session);

    if (data.user) {
        const { error: insertError } = await supabase.from('user_roles').insert({
            user_id: data.user.id,
            role: 'teacher'
        });

        if (insertError) {
            console.error('Insert error:', insertError);
        } else {
            console.log('Insert success. Teacher role applied!');
        }
    }
}

testSignup();
