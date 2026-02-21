const GEMINI_API_KEY = "AIzaSyDGbjiI5NZd33eWqiGtjhAjV4gdvzU0lZg";
const subject = "Science";
const topic = "Solar System";
const gradeLevel = "Class 8";
const questionType = "mcq";
const count = 2;

const prompt = `You are an expert exam question generator. Generate ${count} ${questionType} questions for a ${gradeLevel} level ${subject} exam on the topic: "${topic}".

For mcq questions, provide 4 options and indicate the correct answer.
For msq (multiple select questions), provide at least 4 options and indicate ALL correct answers in an array format.
For theory questions, provide a model answer.

Return a JSON array exactly with this structure:
[
  {
    "question_text": "...",
    "question_type": "${questionType}",
    "options": ["A", "B", "C", "D"], // only for mcq or msq, omit for theory
    "correct_answer": "...", // for mcq or theory (as string), for msq provide a stringified JSON array of correct options e.g., "[\"A\", \"B\"]"
    "marks": 2
  }
]

IMPORTANT: Only return valid JSON array, without markdown syntax like \`\`\`json.`;

async function main() {
    console.log("Sending request to Gemini API...");
    try {
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
        console.log("Status Code:", response.status);
        console.log("Response Body:", JSON.stringify(data, null, 2));

        if (data.error) {
            console.error("API returned error:", data.error.message);
            return;
        }

        const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
        console.log("Generated Content part:");
        console.log(content);

        // Test parsing
        try {
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (!jsonMatch) throw new Error("AI did not return a valid JSON array.");
            const parsed = JSON.parse(jsonMatch[0]);
            console.log("Parse successful. Questions:", parsed.length);
        } catch (err) {
            console.error("Parse failed:", err.message);
        }

    } catch (err) {
        console.error("Fetch threw an exception:", err);
    }
}

main();
