const GEMINI_API_KEY = "AIzaSyDGbjiI5NZd33eWqiGtjhAjV4gdvzU0lZg";

async function checkModels() {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
    const data = await response.json();
    console.log(data);
}
checkModels();
