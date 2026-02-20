# ProctorX Frontend Design Specification

This document outlines the detailed frontend structure required to support the ProctorX backend functionality (AI Quiz Generation, Manual Creation, Proctoring).

## 1. Teacher Dashboard
**Route:** `/teacher-dashboard`
**Purpose:** Manage quizzes and generate new ones using AI.

### UI Structure:
- **Header:** User Profile, Logout.
- **AI Quiz Generator Card:**
  - `Prompt Input` (Textarea): "Create a quiz about..."
  - `Generate Button`: Triggers API call to `/generate-quiz`.
- **Quiz Management Table:**
  - Columns: Title, Quiz ID, Created Date, Status, Actions (Edit, Delete, View Results).
- **Quick Stats:**
  - Total Quizzes Created, Total Student Attempts.

## 2. Quiz Editor (Add/Edit Quiz)
**Route:** `/quiz/edit/:quizId`
**Purpose:** Form to create or edit quiz details and questions.
**Mapped to `Back-End/models/Quiz.js`**

### Fields:
#### A. Quiz Settings (Metadata)
| Label | Field Name | Type | Required | Notes |
|:---|:---|:---|:---|:---|
| Quiz Title | `title` | Text | Yes | |
| Allowed Students | `allowedStudents` | Number | Yes | How many can take it |
| Duration (Min) | `durationInMinutes` | Number | Yes | Default: 60 |
| Quiz ID | `quizId` | Text | Yes | Unique ID (Auto-gen or Custom) |

#### B. Questions Editor (Array: `questions`)
*Ability to Add/Remove Questions dynamically.*

**Common Fields:**
- `questionText` (Textarea)
- `marks` (Number)
- `questionType` (Select: `mcq`, `descriptive`, `coding`)

**Conditionals:**
- **If MCQ:**
  - `options` (Array of 4 strings)
  - `correctAnswer` (Index: 0-3)
- **If Descriptive:**
  - `descriptiveAnswer` (Textarea - Model Answer)
- **If Coding:**
  - `language` (Select: `python`, `java`, `cpp`, `javascript`)
  - `starterCode` (Code Editor)
  - `testcases` (List of Input/Output pairs)

## 3. Student Dashboard
**Route:** `/student-dashboard`
**Purpose:** Student landing page.

### fields:
- **Join Quiz:**
  - `Quiz ID / OTP Input`
  - `Start Button`
- **History:**
  - List of past quizzes taken + Scores.

## 4. Exam Interface (Taking the Quiz)
**Route:** `/exam/:quizId`
**Purpose:** Secure environment for taking the test.

### Features:
- **Timer:** Counts down `durationInMinutes`.
- **Proctoring:** Fullscreen enforcement, Tab-switch detection.
- **Question Renderer:**
  - **MCQ:** Radio buttons.
  - **Coding:** Integrated Monaco Editor + "Run" button (Output console).
  - **Descriptive:** Rich Text Editor.

## 5. Result Page
**Route:** `/results/:attemptId`
**Purpose:** Show feedback.

### Fields:
- **Score:** Total marks obtained.
- **Breakdown:** Review of questions (if allowed by settings).
