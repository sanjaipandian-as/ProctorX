const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

async function main() {
  console.log('🌱 Starting quiz creation...');

  const teacher = await prisma.teacher.findUnique({ where: { email: 'teacher@proctorx.com' } });
  if (!teacher) {
    throw new Error('Teacher not found! Run the seed script first.');
  }

  const student = await prisma.student.findUnique({ where: { email: 'student@proctorx.com' } });

  const quizId = 'QZ' + Date.now();
  
  const quiz = await prisma.quiz.create({
    data: {
      quizId,
      title: 'Full Stack Developer Assessment',
      status: 'ACTIVE',
      allowedStudents: student ? [student.email] : [],
      durationInMinutes: 120,
      createdById: teacher.id,
      questions: {
        create: [
          // 5 MCQs
          {
            questionText: 'What is the output of typeof null in JavaScript?',
            options: ['"object"', '"null"', '"undefined"', '"number"'],
            correctAns: 0,
            order: 1,
            questionType: 'mcq',
            marks: 1
          },
          {
            questionText: 'Which HTTP method is idempotent?',
            options: ['POST', 'PATCH', 'PUT', 'None of the above'],
            correctAns: 2,
            order: 2,
            questionType: 'mcq',
            marks: 1
          },
          {
            questionText: 'What does CSS stand for?',
            options: ['Computer Style Sheets', 'Cascading Style Sheets', 'Creative Style Sheets', 'Colorful Style Sheets'],
            correctAns: 1,
            order: 3,
            questionType: 'mcq',
            marks: 1
          },
          {
            questionText: 'Which of the following is a NoSQL database?',
            options: ['MySQL', 'PostgreSQL', 'MongoDB', 'Oracle'],
            correctAns: 2,
            order: 4,
            questionType: 'mcq',
            marks: 1
          },
          {
            questionText: 'What is the virtual DOM in React?',
            options: ['A direct copy of the real DOM', 'An in-memory representation of the real DOM', 'A browser feature', 'A CSS framework'],
            correctAns: 1,
            order: 5,
            questionType: 'mcq',
            marks: 1
          },
          // 3 Descriptive Questions
          {
            questionText: 'Explain the difference between SQL and NoSQL databases.',
            options: [],
            order: 6,
            questionType: 'descriptive',
            descriptiveAnswer: 'SQL databases are relational and have structured schemas. NoSQL databases are non-relational and have flexible schemas.',
            marks: 5
          },
          {
            questionText: 'Describe the event loop in Node.js.',
            options: [],
            order: 7,
            questionType: 'descriptive',
            descriptiveAnswer: 'The event loop allows Node.js to perform non-blocking I/O operations despite being single-threaded by offloading operations to the system kernel whenever possible.',
            marks: 5
          },
          {
            questionText: 'What are the core principles of RESTful APIs?',
            options: [],
            order: 8,
            questionType: 'descriptive',
            descriptiveAnswer: 'Statelessness, client-server architecture, cacheability, uniform interface, layered system, and code on demand.',
            marks: 5
          },
          // 2 Programming Questions
          {
            questionText: 'Write a function that returns the nth Fibonacci number.',
            options: [],
            order: 9,
            questionType: 'coding',
            starterCode: {
              javascript: 'function fibonacci(n) {\n  // Write your code here\n}',
              python: 'def fibonacci(n):\n    # Write your code here\n    pass',
              java: 'class Solution {\n    public int fibonacci(int n) {\n        // Write your code here\n    }\n}',
              cpp: 'class Solution {\npublic:\n    int fibonacci(int n) {\n        // Write your code here\n    }\n};'
            },
            testcases: [
              { input: '0', output: '0' },
              { input: '1', output: '1' },
              { input: '2', output: '1' },
              { input: '3', output: '2' },
              { input: '4', output: '3' },
              { input: '5', output: '5' },
              { input: '6', output: '8' },
              { input: '7', output: '13' },
              { input: '8', output: '21' },
              { input: '10', output: '55' }
            ],
            marks: 10
          },
          {
            questionText: 'Write a function that checks if a string is a palindrome.',
            options: [],
            order: 10,
            questionType: 'coding',
            starterCode: {
              javascript: 'function isPalindrome(str) {\n  // Write your code here\n}',
              python: 'def isPalindrome(s):\n    # Write your code here\n    pass',
              java: 'class Solution {\n    public boolean isPalindrome(String s) {\n        // Write your code here\n    }\n}',
              cpp: '#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    bool isPalindrome(string s) {\n        // Write your code here\n    }\n};'
            },
            testcases: [
              { input: '"racecar"', output: 'true' },
              { input: '"hello"', output: 'false' },
              { input: '"madam"', output: 'true' },
              { input: '"a"', output: 'true' },
              { input: '""', output: 'true' },
              { input: '"ab"', output: 'false' },
              { input: '"aba"', output: 'true' },
              { input: '"abcba"', output: 'true' },
              { input: '"abccba"', output: 'true' },
              { input: '"abccbx"', output: 'false' }
            ],
            marks: 10
          }
        ]
      }
    }
  });

  console.log(`✅ Quiz created successfully!`);
  console.log(`📌 Quiz Title: ${quiz.title}`);
  console.log(`🔑 Quiz ID (use this for students to join): ${quiz.quizId}`);
}

main()
  .catch((e) => {
    console.error('❌ Error creating quiz:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
