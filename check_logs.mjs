import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://aheqpwajbrwbulyfwqzr.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoZXFwd2FqYnJ3YnVseWZ3cXpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NzAwMjYsImV4cCI6MjA4NzI0NjAyNn0.oSlt42qBSHpqjCH4arNGme9B6Je6mr988CrXyFVxwJk');

async function run() {
    const { data, error } = await supabase.from("cheating_logs").select("event_type, description, evidence_url");
    console.log("Logs:", data, error);
}
run();
