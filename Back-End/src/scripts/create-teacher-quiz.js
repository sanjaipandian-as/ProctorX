const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const { generateQuizId, generateOTP } = require('../utils/helpers');

async function main() {
  console.log('Starting quiz creation script for sanjaipandian.as@gmail.com...');

  // 1. Find or create the teacher account
  let teacher = await prisma.teacher.findUnique({
    where: { email: 'sanjaipandian.as@gmail.com' }
  });

  if (!teacher) {
    console.log('Teacher not found. Creating account...');
    const passwordHash = await bcrypt.hash('1234567', 10);
    teacher = await prisma.teacher.create({
      data: {
        name: 'Sanjai Pandian',
        email: 'sanjaipandian.as@gmail.com',
        passwordHash,
        staffId: 'STAFF_SANJAI',
        isApproved: true
      }
    });
    console.log('Teacher account created successfully!');
  } else {
    console.log('Teacher account already exists.');
  }

  // 2. Generate quiz parameters
  const customQuizId = generateQuizId();
  const otpCode = generateOTP();
  const otpExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  const questions = [
    {
      questionText: 'What does CPU stand for?',
      options: ['Central Process Unit', 'Central Processing Unit', 'Computer Processing Unit', 'Control Processing Unit'],
      correctAns: 1,
      order: 0
    },
    {
      questionText: 'Which programming language is mainly used for web client-side scripting?',
      options: ['Python', 'Java', 'JavaScript', 'C++'],
      correctAns: 2,
      order: 1
    },
    {
      questionText: 'What is the worst-case time complexity of Binary Search?',
      options: ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'],
      correctAns: 2,
      order: 2
    },
    {
      questionText: 'Which of the following is a Relational Database Management System?',
      options: ['MongoDB', 'Redis', 'PostgreSQL', 'Cassandra'],
      correctAns: 2,
      order: 3
    },
    {
      questionText: 'What does HTML stand for?',
      options: ['Hyper Text Markup Language', 'High Text Markup Language', 'Hyper Tabular Markup Language', 'None of the above'],
      correctAns: 0,
      order: 4
    },
    {
      questionText: 'Which cryptographic protocol secures communication over a computer network (HTTPS)?',
      options: ['FTP', 'SSH', 'TLS/SSL', 'SMTP'],
      correctAns: 2,
      order: 5
    },
    {
      questionText: 'Which keyword is used to declare a block-scoped variable in modern JavaScript?',
      options: ['var', 'let', 'global', 'define'],
      correctAns: 1,
      order: 6
    },
    {
      questionText: 'What is the main role of a DNS server?',
      options: ['Translate IP addresses to domain names', 'Translate domain names to IP addresses', 'Route packets across gateways', 'Cache web pages locally'],
      correctAns: 1,
      order: 7
    },
    {
      questionText: 'Which CSS property is used to alter the foreground text color of an element?',
      options: ['font-color', 'text-color', 'color', 'background-color'],
      correctAns: 2,
      order: 8
    },
    {
      questionText: 'What does SQL stand for?',
      options: ['Simple Query Language', 'Structured Query Language', 'Sequential Query Language', 'Standard Query Language'],
      correctAns: 1,
      order: 9
    }
  ];

  // 3. Create the Quiz
  const quiz = await prisma.quiz.create({
    data: {
      quizId: customQuizId,
      title: 'General Computer Science & Web Quiz',
      durationInMinutes: 45,
      otp: otpCode,
      otpExpiresAt,
      createdById: teacher.id,
      questions: {
        create: questions
      }
    }
  });

  console.log('\n--- QUIZ CREATION COMPLETED ---');
  console.log(`Quiz ID (Code): ${quiz.quizId}`);
  console.log(`Title: ${quiz.title}`);
  console.log(`Teacher: ${teacher.name} (${teacher.email})`);
  console.log(`Initial OTP: ${quiz.otp}`);
  console.log(`OTP Expiry: ${quiz.otpExpiresAt}`);
  
  process.exit(0);
}

main().catch(err => {
  console.error('Error running script:', err);
  process.exit(1);
});
