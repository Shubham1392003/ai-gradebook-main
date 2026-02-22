# AI Gradebook & Secure Exam Platform

A modern, robust, and secure serverless application for creating, taking, and evaluating online exams. This platform features a powerful client-side anti-cheat engine built with TensorFlow.js to ensure academic integrity without compromising privacy by keeping video processing local.

## 🛠️ Tools & Technologies Used

### Frontend (Client-Side)
* **React 18 & Vite:** The core framework and build tool for a fast, responsive user interface and lightning-fast hot module replacement.
* **TypeScript:** For strict type-checking, robust code architecture, and fewer runtime errors.
* **Tailwind CSS & Shadcn UI (Radix UI):** For rapid, accessible, and highly customizable UI component design.
* **React Router DOM:** For seamless and secure navigation between teacher and student dashboards.
* **Framer Motion:** For fluid component transitions and micro-animations that enhance the user experience.
* **jsPDF & jsPDF-AutoTable:** Used for generating downloadable, structured, and official PDF scorecards natively in the browser.

### Proctoring / Anti-Cheat Engine
* **TensorFlow.js & Blazeface:** Google's lightweight machine learning model running directly inside the browser memory. It reliably detects multiple faces via the webcam to prevent unauthorized assistance.
* **Browser APIs:** 
  * `MediaDevices API` for webcam access.
  * `Page Visibility API` for detecting tab switching.
  * `Window Focus API` for detecting if the user clicks outside the exam window.
  * Event listeners for preventing copy/paste and context menus.

### Backend (Serverless / Database)
* **Supabase:** Acts as the complete backend-as-a-service (BaaS), handling:
  * **PostgreSQL Database:** Storing users, exams, questions, submissions, warnings, evaluations, and scorecards.
  * **Authentication:** Handling student and teacher login flows securely.
  * **Storage (Buckets):** Securely saving periodic photo evidence captures from the webcam monitor.

---

## 🏗️ Architecture Overview

The application follows a standard **Serverless Client-Server Architecture** utilizing a BaaS (Supabase), ensuring high availability and scalability without managing servers.

```text
[ User / Browser ] 
        |
        |  (React, TypeScript, Tailwind, TensorFlow.js)
        v
[ Frontend Application Layer ] 
   ├─ Teacher Dashboard (Exam creation, evidence review, grading)
   ├─ Student Dashboard (Exam taking, scorecards, grievances)
   └─ Anti-Cheat Engine (Webcam monitoring, system locks)
        |
        |  (Supabase JS Client via REST/WebSockets)
        v
[ Supabase Backend Layer ]
   ├─ Auth Service (JWT based authentication & authorization)
   ├─ PostgreSQL Database (exams, submissions, cheating_logs, evaluations tables)
   └─ Storage Service (Webcam photo evidence bucket)
```

---

## 🔄 Core Application Workflows

### A. Exam Creation Workflow (Teacher)
1. **Setup:** Teacher logs in and creates a new exam, specifying the Title, Subject, Duration, Total marks, and Warning limits.
2. **Drafting:** Teacher adds questions to the exam. Supports various formats like Multiple Choice, Multiple Select, or Subjective Theory.
3. **Publishing:** Teacher schedules the exam and sets it to "Published", making it visible to students of that particular class.

### B. Exam Taking & Anti-Cheat Workflow (Student)
1. **Entry:** Student clicks "Start Exam". The app requires and verifies webcam permissions to proceed.
2. **Initialization:** A submission record is created in Supabase (`status: in_progress`). The `@tensorflow-models/blazeface` AI model loads into the browser memory.
3. **Monitoring:** 
   * As the student takes the test, the camera silently analyzes the video feed locally. 
   * If a second face is detected, or the student switches tabs, copies/pastes, or clicks out, a warning is triggered.
   * A photo is snapped via the canvas and uploaded to Supabase Storage. The infraction is logged into `cheating_logs`.
   * A cooldown period prevents rapid, unfair warning accumulation.
4. **Enforcement:** If infractions cross the allowed threshold (e.g., 3 warnings), the exam instantly Auto-Submits and flags the student.
5. **Completion:** The secure exam submits all answers to the database either when the student finishes or the timer runs out.

### C. Evaluation & Review Workflow (Teacher)
1. **Evidence Check:** Teacher reviews submissions, checking the auto-collected photo evidence for cheating flags to verify exam integrity.
2. **Grading:** Teacher views the answers. Answers can be marked manually or auto-evaluated by AI components (if configured).
3. **Publish Scorecard:** Teacher finalizes the evaluation and publishes the scorecard. 

### D. Result Workflow (Student)
1. **View:** Student logs in to see their grade percentage and overall performance.
2. **Download:** Student clicks download, which triggers `jsPDF` to compile their per-question marks into a structured, official PDF document.
3. **Grievance:** If the student feels the strict anti-cheat tracking or grading was unfair, they can raise a grievance to the teacher for re-evaluation.
