# ProctorX

# 📘 ProctorX – Secure, AI-Powered Quiz Application

ProctorX is a professional, secure, and AI-powered quiz platform designed to ensure fairness, integrity, and privacy during exams. Built for educational institutions and corporate training environments, ProctorX provides teachers with tools to create and manage quizzes, while ensuring that students stay focused and honest during tests. The platform integrates advanced monitoring techniques and AI-assisted question generation to deliver a next-generation assessment experience.

---

## 📝 AI Prompt: Quiz App with OTP, Randomization, and Fairness Features

### Project Goal
Build a secure Quiz Application where teachers can create and manage quizzes, students can join using OTP-based access, and results are stored/exported for analysis.

---

### 🔹 Key Features

#### ✅ User Roles
- **Admin**  
  - Approves teacher accounts through staff ID verification.  
  - Grants AI access to teachers after approval.  

- **Teacher**  
  - Creates quizzes and generates OTPs for students.  
  - Exports results in Excel format.  
  - Uses AI-assisted question generation after admin approval.

- **Student**  
  - Joins quizzes using OTP.  
  - Answers questions only once per account.

---

#### ✅ Quiz Access & OTP
- Teacher generates OTP valid for 5 minutes.  
- The system restricts access to a declared number of students to prevent fake accounts.  
- Each student gets only one attempt per quiz.

---

#### ✅ Fairness & Anti-Cheating
- Fullscreen mode is mandatory; quiz auto-submits after 5 fullscreen exits.  
- Copy-paste functionality is disabled during the quiz.  
- Camera and microphone permissions are requested but not recorded—only to ensure focus and fairness.

---

#### ✅ Question Types
- Multiple Choice Questions (MCQs).  
- True/False Questions.

---

#### ✅ AI Integration
- Teachers can generate quiz questions using OpenAI or Gemini API based on input topics.  
- Admin approval is required before AI features are enabled for teachers.  
- Each student receives a shuffled set of questions and options to prevent collaboration.

---

#### ✅ Database Handling
- Store user details including name, email, and role.  
- Store quizzes, OTPs (with expiration), student responses, and results.  
- Results are securely stored and can be exported as Excel files for review.

---

#### ✅ Extra Security
- Randomized question sets ensure uniqueness for each student.  
- Optional AI-based similarity checks can detect copy-paste answer patterns.

---

## 📝 Camera Monitoring & Warning System

### Objective
Ensure students remain focused on the exam screen, prevent cheating, and apply penalties if they repeatedly look away.

---

### 1️⃣ When Monitoring Starts
- Camera monitoring starts only after the student clicks “Start Quiz.”  
- Fullscreen mode is enforced during the quiz.  
- Camera access is requested through the browser using `navigator.mediaDevices.getUserMedia`.

---

### 2️⃣ Real-Time Monitoring
- AI/ML libraries like TensorFlow.js or MediaPipe track:  
  - Face presence  
  - Eye and gaze direction  
- Frames are captured at intervals (e.g., every 1–2 seconds) to detect off-screen behavior.

---

### 3️⃣ Warning System
- Each time a student looks away → warning counter is incremented.  
- Live warnings are displayed to students (“Warning X/10 – Stay focused on the screen”).  
- The maximum warning limit is 10.

---

### 4️⃣ Penalty Handling
- When warnings reach 10:  
  - Marks can be automatically reduced by 5 or 10 points, based on teacher configuration.  
  - Alternatively, teachers can manually apply penalties.  
- Warning counts and penalties are stored in the database for transparency and review.

```json
{
  "studentId": "64abc123",
  "quizId": "abc456",
  "examStartTime": "2025-09-04T17:00:00Z",
  "warnings": 10,
  "penaltyApplied": 5
}
