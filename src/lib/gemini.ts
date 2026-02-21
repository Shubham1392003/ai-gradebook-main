const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY; // provided by the user

export const generateQuestionsWithGemini = async (
    subject: string,
    topic: string,
    gradeLevel: string,
    questionType: string,
    count: number
) => {
    const prompt = `You are an expert exam question generator. Generate ${count} ${questionType} questions for a ${gradeLevel} level ${subject} exam on the topic: "${topic}".

For mcq questions, provide 4 options and indicate the correct answer.
For msq (multiple select questions), provide at least 4 options and indicate ALL correct answers in an array format.
For theory questions, provide a model answer.
For tf (true/false) questions, provide exactly 2 options: ["True", "False"] and indicate the correct answer.
For nat (numerical answer type) questions, do NOT provide options. Just provide the exact numerical correct answer as a string.

Return a JSON array exactly with this structure:
[
  {
    "question_text": "...",
    "question_type": "${questionType}",
    "options": ["A", "B", "C", "D"], // only for mcq, msq, or tf. omit for theory and nat
    "correct_answer": "...", // for mcq/tf/theory/nat (as string), for msq provide a stringified JSON array of correct options e.g., "[\"A\", \"B\"]"
    "marks": 2
  }
]

IMPORTANT: Only return valid JSON array, without markdown syntax like \`\`\`json.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
            }
        }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message || "Failed to generate questions");

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

    try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error("AI did not return a valid JSON array.");
        return JSON.parse(jsonMatch[0]);
    } catch (err: any) {
        console.error("JSON parse error from Gemini:", content);
        throw new Error("Failed to parse AI response: " + err.message);
    }
};

export const evaluateSubmissionWithGemini = async (
    questionText: string,
    correctAnswer: string,
    studentAnswer: string,
    marks: number,
    type: string
) => {
    const prompt = `You are an expert examiner. Evaluate this student's answer for the following question.
Question: "${questionText}"
Question Type: "${type}"
Correct Answer/Model Answer: "${correctAnswer}"
Student's Answer: "${studentAnswer}"
Max Marks: ${marks}

Evaluate strictly but fairly.
Return a JSON object with this exact structure (no markdown wrapper):
{
  "marks_obtained": 0.0,
  "ai_explanation": "..."
}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.4 }
        }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : { marks_obtained: 0, ai_explanation: "Failed to parse AI evaluation" };
    } catch (err) {
        return { marks_obtained: 0, ai_explanation: "Failed to parse AI evaluation" };
    }
};
