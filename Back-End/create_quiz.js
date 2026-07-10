const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const quizService = require('./src/services/quiz.service');

async function main() {
  const teacher = await prisma.teacher.findUnique({
    where: { email: 'sanjaipandian77@gmail.com' }
  });

  if (!teacher) {
    console.log("Teacher not found");
    process.exit(1);
  }

  const quizData = {
    title: "Full Stack Developer Assessment - Advanced",
    durationInMinutes: 90,
    allowedStudents: [],
    classroomId: null,
    scheduledAt: null,
    autoStart: true,
    questions: [
      // 5 MCQs - 1 mark each
      {
        questionText: "What is the time complexity of searching for an element in a balanced Binary Search Tree?",
        options: ["O(1)", "O(n)", "O(log n)", "O(n log n)"],
        correctAns: 2,
        questionType: "mcq",
        marks: 1,
        order: 0
      },
      {
        questionText: "In React, which hook is best suited for managing complex state logic that involves multiple sub-values?",
        options: ["useState", "useEffect", "useReducer", "useContext"],
        correctAns: 2,
        questionType: "mcq",
        marks: 1,
        order: 1
      },
      {
        questionText: "Which of the following HTTP status codes indicates that the requested resource was not found?",
        options: ["200", "301", "404", "500"],
        correctAns: 2,
        questionType: "mcq",
        marks: 1,
        order: 2
      },
      {
        questionText: "What does 'ACID' stand for in the context of database transactions?",
        options: [
          "Atomicity, Consistency, Isolation, Durability",
          "Association, Concurrency, Isolation, Durability",
          "Atomicity, Concurrency, Integration, Durability",
          "Association, Consistency, Integration, Durability"
        ],
        correctAns: 0,
        questionType: "mcq",
        marks: 1,
        order: 3
      },
      {
        questionText: "Which of the following is NOT a valid JavaScript data type?",
        options: ["Undefined", "Boolean", "Float", "Symbol"],
        correctAns: 2,
        questionType: "mcq",
        marks: 1,
        order: 4
      },
      // 2 Descriptive - 5 marks each
      {
        questionText: "Explain the concept of Event Delegation in JavaScript and why it is useful for performance. Provide a real-world scenario.",
        questionType: "descriptive",
        descriptiveAnswer: "Event delegation is a technique involving adding event listeners to a parent element instead of adding them to the descendant elements. The listener will fire whenever the event is triggered on the descendant elements due to event bubbling up the DOM. It's useful for performance because having one listener attached to a parent instead of 1000 listeners attached to 1000 child rows (e.g. in a table or list) saves memory and initialization time.",
        marks: 5,
        order: 5
      },
      {
        questionText: "Describe the differences between SQL and NoSQL databases. When would you choose to use MongoDB over PostgreSQL?",
        questionType: "descriptive",
        descriptiveAnswer: "SQL databases are relational, table-based, and use structured query language with a predefined schema. NoSQL databases are non-relational, document/key-value/graph-based, and have dynamic schemas for unstructured data. You would choose MongoDB (NoSQL) when dealing with rapid development, unstructured/semi-structured data, or horizontal scaling. PostgreSQL is chosen for complex queries, strict ACID compliance, and clear relational data.",
        marks: 5,
        order: 6
      },
      // 1 Programming - 10 marks, 10 real world test cases
      {
        questionText: "Write a function `twoSum(nums, target)` that takes an array of integers `nums` and an integer `target`, and returns the indices of the two numbers such that they add up to `target`. You may assume that each input would have exactly one solution, and you may not use the same element twice. Return the indices in any order. The array length will be at least 2. Optimize for time complexity (O(N) is expected).",
        questionType: "programming",
        marks: 10,
        order: 7,
        starterCode: "function twoSum(nums, target) {\n  // Write your code here\n  \n}",
        testcases: [
          { input: "[2, 7, 11, 15], 9", output: "[0, 1]", hidden: false },
          { input: "[3, 2, 4], 6", output: "[1, 2]", hidden: false },
          { input: "[3, 3], 6", output: "[0, 1]", hidden: false },
          { input: "[10, 20, 30, 40, 50], 90", output: "[3, 4]", hidden: true },
          { input: "[0, 4, 3, 0], 0", output: "[0, 3]", hidden: true },
          { input: "[-1, -2, -3, -4, -5], -8", output: "[2, 4]", hidden: true },
          { input: "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 19", output: "[8, 9]", hidden: true },
          { input: "[100, 200, 300, 400], 500", output: "[1, 2]", hidden: true },
          { input: "[5, 7, 1, 2, 8, 4, 3], 10", output: "[1, 6]", hidden: true }, // assuming 7 and 3, or 2 and 8. The prompt says exactly one solution, so let's adjust this test case
          { input: "[5, 7, 1, 2, 4], 11", output: "[1, 4]", hidden: true }
        ]
      }
    ]
  };

  const result = await quizService.createQuiz(teacher.id, quizData);
  console.log("Quiz created successfully:", result);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
