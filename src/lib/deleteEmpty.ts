import { supabase } from "@/integrations/supabase/client";

export const deleteEmptyExams = async () => {
    // This runs from the client context, so it will authenticate as the teacher if we call it from a component!
    const { data: exams } = await supabase.from('exams').select('id, title');
    if (exams) {
        for (const exam of exams) {
            const { count } = await supabase.from('questions').select('*', { count: 'exact', head: true }).eq('exam_id', exam.id);
            if (count === 0) {
                console.log("Deleting exam", exam.id);
                await supabase.from('exams').delete().eq('id', exam.id);
            }
        }
    }
}
