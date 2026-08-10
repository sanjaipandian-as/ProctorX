const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const teachers = await prisma.teacher.findMany();
  console.log('Teachers:', JSON.stringify(teachers, null, 2));
  const students = await prisma.student.findMany();
  console.log('Students:', JSON.stringify(students, null, 2));
  const quizzes = await prisma.quiz.findMany();
  console.log('Quizzes:', JSON.stringify(quizzes, null, 2));
}

main().catch(err => {
  console.error(err);
}).finally(() => {
  prisma.$disconnect();
});
