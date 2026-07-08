const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.question.updateMany({
    where: { questionType: 'programming' },
    data: { questionType: 'coding' }
  });
  console.log('Updated to coding');
  await prisma.$disconnect();
}
main().catch(e => {
  console.error(e);
  process.exit(1);
});
