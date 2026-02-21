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
                responseMimeType: "application/json",
            }
        }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message || "Failed to generate questions");

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

    try {
        const cleaned = content.replace(/```json/gi, "").replace(/```/gi, "").trim();
        return JSON.parse(cleaned);
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
            generationConfig: { temperature: 0.4, responseMimeType: "application/json" }
        }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    try {
        const cleaned = content.replace(/```json/gi, "").replace(/```/gi, "").trim();
        return JSON.parse(cleaned);
    } catch (err) {
        return { marks_obtained: 0, ai_explanation: "Failed to parse AI evaluation" };
    }
};

export const extractOfflineQuestions = async (base64Pdf: string) => {
    const prompt = `You are an expert exam key generator. I have provided a question paper as a PDF. Please extract all the questions, determine their types (mcq, msq, theory, nat, or tf), options (if applicable), maximum marks per question, and generate a highly accurate model answer or correct answer key for each question based on standard educational curriculum.
Return a JSON array exactly with this structure:
[
  {
    "question_text": "...",
    "question_type": "theory", 
    "options": ["A", "B", "C", "D"], // ONLY IF mcq, msq, or tf (omit otherwise)
    "correct_answer": "...", // The model answer or the exact right choice
    "marks": 5
  }
]
IMPORTANT: Only return a valid JSON array.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType: "application/pdf", data: base64Pdf } }
                    ]
                }
            ],
            generationConfig: { temperature: 0.2, responseMimeType: "application/json" }
        }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    try {
        const cleaned = content.replace(/```json/gi, "").replace(/```/gi, "").trim();
        return JSON.parse(cleaned);
    } catch (err: any) {
        throw new Error("Failed to parse extracted AI questions: " + err.message);
    }
};

export const evaluateOfflineAnswerSheet = async (base64Pdf: string, questionKeyList: any[]) => {
    const prompt = `You are an expert examiner. I am providing a student's answer sheet as a PDF, along with the official answer key containing questions, model answers, and maximum marks.
Please read the handwritten or typed answers from the PDF, map them to the corresponding questions in the key, and evaluate them strictly but fairly.
Here is the question key:
${JSON.stringify(questionKeyList, null, 2)}

Return a JSON array exactly with this structure:
[
  {
    "question_text": "...",
    "marks_obtained": 4.5,
    "ai_explanation": "..." 
  }
]
IMPORTANT: Only return a valid JSON array.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType: "application/pdf", data: base64Pdf } }
                    ]
                }
            ],
            generationConfig: { temperature: 0.2, responseMimeType: "application/json" }
        }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
    try {
        const cleaned = content.replace(/```json/gi, "").replace(/```/gi, "").trim();
        return JSON.parse(cleaned);
    } catch (err: any) {
        throw new Error("Failed to parse structured evaluated answers: " + err.message);
    }
};
