<div align="center">

# 🎯 AI Gradebook & Secure Exam Platform

### Craft, Take, and Evaluate Secure Exams with AI-Powered Proctoring

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen?style=for-the-badge&logo=vercel)](#)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)](https://www.tensorflow.org/js)

*A modern, robust platform for seamless online exams featuring real-time AI-powered webcam proctoring, secure evaluation workflows, and instant scorecard generation. Built with React, TypeScript, and Supabase.*

</div>

---

## ✨ Features at a Glance

<table>
<tr>
<td width="50%">

### 🎯 Core Features
- 📝 **Secure Exam Creation** - Flexible question types (MCQ, MSQ, Theory)
- 🤖 **AI Proctoring Engine** - Real-time face detection using TensorFlow.js
- 📸 **Automated Evidence Capture** - Silent screenshots for cheating violations
- 📊 **Teacher Dashboard** - Comprehensive tracking and evaluation system
- 🌓 **Dark Mode** - Beautiful dark theme support for modern aesthetics
- 📱 **Responsive Design** - Works perfectly on all devices

</td>
<td width="50%">

### 🚀 Advanced Features
- 🎓 **Automated Scorecards** - Generate official PDFs via jsPDF natively
- 💾 **Cloud Storage** - Secure evidence logging backed by Supabase
- ⚖️ **Grievance System** - Built-in student appeal workflows
- 🚫 **Browser Lockdown** - Tab-switch detection & copy-paste prevention
- 🛡️ **Role-Based Access** - Distinct Teacher and Student workspaces
- 🚀 **Serverless Architecture** - Highly scalable and easy to maintain

</td>
</tr>
</table>

---

## 🚀 Tech Stack

<div align="center">

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)

</div>

### Frontend
- **React 18** with TypeScript
- **Vite** for blazing fast builds
- **Tailwind CSS** + **Shadcn UI** components
- **React Router** for secure, role-based navigation
- **jsPDF** & **jsPDF-AutoTable** for scorecard generation
- **Framer Motion** for fluid micro-animations

### Backend & Database
- **Supabase** (PostgreSQL) as a Backend-as-a-Service
- **Supabase Storage** for hosting photo evidence
- **Row-Level Security** policies directly protecting exam integrity
- **JWT Authentication** for Teachers and Students

### AI & Proctoring Engine
- **TensorFlow.js** executing directly inside the browser
- **Blazeface** for lightweight, privacy-preserving face tracking
- Native **Browser MediaDevices & Focus APIs**

---

## 📂 Project Structure

```
ai-gradebook-main/
│
├── 📁 src/
│   ├── 📁 components/
│   │   ├── 📁 exam/           # Proctoring (WebcamMonitor) & exam UI
│   │   ├── 📁 ui/             # Shadcn UI reusable components
│   │   └── ...
│   ├── 📁 pages/
│   │   ├── 🎓 student/        # Student dashboard, exam taking, scorecards
│   │   ├── 👨‍🏫 teacher/        # Teacher dashboard, evidence review, grading
│   │   └── ...
│   ├── 📁 hooks/
│   │   └── useAntiCheat.tsx   # Core tracking and violation logic
│   ├── 📁 integrations/
│   │   └── supabase/          # Supabase client & generated types
│   └── 🎨 index.css           # Global Tailwind environment
│
├── 📦 package.json            # Project metadata & dependencies
└── 📖 README.md               # You are here!
```

---

## �️ How It Works

### 1️⃣ **Exam Creation Workflow (Teacher)**
```
Setup Details (Title, Subject, Warning Limits) 
     ↓
Drafting Questions (MCQ, MSQ, Subjective) 
     ↓
Publish and Schedule for Students
```

### 2️⃣ **AI Anti-Cheat Workflow (Student)**
```javascript
// Frontend: src/components/exam/WebcamMonitor.tsx
// Local Browser Anti-Cheat utilizing TensorFlow
const model = await blazeface.load();
const predictions = await model.estimateFaces(videoRef.current, false);

if (predictions.length > 1) {
  onWarning("Multiple people detected!", "multiple_faces");
} else if (predictions.length === 0) {
  onWarning("No face detected on camera!", "missing_face");
}
```
If infractions cross the allowed threshold, a snapshot evidence is taken via HTML5 Canvas, sent to Supabase Storage, and the exam is instantly auto-submitted.

### 3️⃣ **Evaluation & Review Workflow**
```
Review Auto-Collected Photo Evidence → Grade Subjective Answers → Publish Official Scorecard
```

### 4️⃣ **Automated Scorecards generation (jsPDF)**
```javascript
// Frontend: Automatically structures the student's evaluated marks into a PDF
const doc = new jsPDF();
doc.text(`Scorecard for ${exam.title}`, 14, 20);
autoTable(doc, { 
  head: [['Question', 'Marks Awarded', 'Max Marks']],
  body: examData.results,
});
doc.save(`${student_name}_scorecard.pdf`);
```

---

## 🎯 API Integration & Database Schema

### Supabase Database Architecture
```sql
-- Exams Table
CREATE TABLE exams (
  id UUID PRIMARY KEY,
  teacher_id UUID REFERENCES auth.users,
  title TEXT,
  subject TEXT,
  duration_minutes INTEGER,
  warning_limit INTEGER DEFAULT 3
);

-- Submissions Table
CREATE TABLE submissions (
  id UUID PRIMARY KEY,
  exam_id UUID REFERENCES exams,
  student_id UUID REFERENCES auth.users,
  status TEXT, -- 'in_progress', 'submitted', 'terminated'
  answers JSONB
);

-- Cheating Logs (Evidence)
CREATE TABLE cheating_logs (
  id UUID PRIMARY KEY,
  submission_id UUID REFERENCES submissions,
  event_type TEXT,
  evidence_url TEXT, -- Points to Supabase Storage Bucket
  description TEXT
);
```

---

## 🚧 Setup & Installation

### Prerequisites
- Node.js 18+
- Supabase account & project

### 1. Clone the Repository
```bash
git clone https://github.com/Shubham1392003/ai-gradebook-main.git
cd ai-gradebook-main
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the Application
```bash
npm run dev
```
Visit `http://localhost:8080` (or the port Vite outputs)

### 5. Deployment
This application can easily be deployed onto Vercel, Netlify, or any static hosting provider.
```bash
npm run build
```

---

## 💡 Key Features Breakdown

### 🤖 AI Proctoring Engine
- Local, browser-based execution ensures total student privacy (video is never streamed to external servers).
- Tracks missing faces, multiple faces, excessive background audio, and physical tab-switching.
- Implements cooldown delays so honest mistakes aren't rapidly double-punished.

### 🎓 Dynamic Grading System
- Automatically grades multiple-choice/select questions upon submission.
- Allows teachers to seamlessly override or assign partial points for long-form answers.

### 📊 Comprehensive Dashboards
- **Teacher View:** Deep aggregate performance statistics, student-by-student evidence reviews, built with Recharts.
- **Student View:** Active timers, countdowns, grievance submissions, and seamless result downloading.

---

## 👨‍💻 Author

<div align="center">

### **Developed & Built by Shubham Madhav Kendre**

*AI/ML & Full Stack Developer*

[![Portfolio](https://img.shields.io/badge/Portfolio-FF5722?style=for-the-badge&logo=google-chrome&logoColor=white)](https://sk-coral.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Shubham1392003)
[![Instagram](https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://www.instagram.com/shubham.x003/)

</div>

---

<div align="center">

### ⭐ Star this repo if you found it helpful!

**Made with ❤️ and lots of ☕**

</div>
