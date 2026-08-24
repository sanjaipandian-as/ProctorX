const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create an Admin
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPasswordHash,
    },
  });
  console.log(`✅ Admin created: ${admin.username} / admin123`);

  // 2. Create an Approved Teacher
  const teacherPasswordHash = await bcrypt.hash('teacher123', 10);
  const teacher = await prisma.teacher.upsert({
    where: { email: 'teacher@proctorx.com' },
    update: {},
    create: {
      name: 'Demo Teacher',
      email: 'teacher@proctorx.com',
      passwordHash: teacherPasswordHash,
      staffId: 'STAFF_001',
      isApproved: true,
    },
  });
  console.log(`✅ Approved Teacher created: ${teacher.email} / teacher123`);

  // 3. Create a Student
  const studentPasswordHash = await bcrypt.hash('student123', 10);
  const student = await prisma.student.upsert({
    where: { email: 'student@proctorx.com' },
    update: {},
    create: {
      name: 'Demo Student',
      email: 'student@proctorx.com',
      passwordHash: studentPasswordHash,
      isActive: true,
    },
  });
  console.log(`✅ Student created: ${student.email} / student123`);

  console.log('🎉 Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
