const prisma = require('../config/database');
const { redis } = require('../config/redis');

function generateClassCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'CL-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const createClassroom = async (teacherId, { name }) => {
  const code = generateClassCode();
  
  const classroom = await prisma.classroom.create({
    data: {
      name,
      code,
      createdById: teacherId
    }
  });

  return classroom;
};

const getClassrooms = async (teacherId) => {
  return prisma.classroom.findMany({
    where: { createdById: teacherId },
    include: {
      _count: {
        select: { students: true, quizzes: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

const addStudentToClassroom = async (classroomId, { email }) => {
  const student = await prisma.student.findUnique({
    where: { email }
  });

  if (!student) {
    const err = new Error('Student account with this email does not exist.');
    err.statusCode = 404;
    throw err;
  }

  // Update classroom relation to connect student
  const updatedClassroom = await prisma.classroom.update({
    where: { id: classroomId },
    data: {
      students: {
        connect: { id: student.id }
      }
    },
    include: {
      students: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  return updatedClassroom;
};

const getClassroomDetails = async (classroomId) => {
  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    include: {
      students: {
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true
        }
      },
      quizzes: {
        select: {
          id: true,
          quizId: true,
          title: true,
          status: true
        }
      }
    }
  });

  if (!classroom) {
    const err = new Error('Classroom not found.');
    err.statusCode = 404;
    throw err;
  }

  return classroom;
};

const removeStudentFromClassroom = async (classroomId, studentId) => {
  const classroom = await prisma.classroom.update({
    where: { id: classroomId },
    data: {
      students: {
        disconnect: { id: studentId }
      }
    }
  });

  return classroom;
};

const searchStudents = async (query = '') => {
  return prisma.student.findMany({
    where: {
      OR: [
        { email: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      name: true,
      email: true
    },
    take: 10
  });
};

const joinClassroomByCode = async (studentId, code) => {
  const classroom = await prisma.classroom.findUnique({
    where: { code: code.trim().toUpperCase() },
    include: { students: { select: { id: true } } }
  });

  if (!classroom) {
    const err = new Error('Classroom not found with this code.');
    err.statusCode = 404;
    throw err;
  }

  const isAlreadyEnrolled = classroom.students.some(s => s.id === studentId);
  if (isAlreadyEnrolled) {
    const err = new Error('You are already enrolled in this classroom.');
    err.statusCode = 400;
    throw err;
  }

  const updatedClassroom = await prisma.classroom.update({
    where: { id: classroom.id },
    data: {
      students: {
        connect: { id: studentId }
      }
    }
  });

  return { message: 'Enrolled successfully', classroomName: updatedClassroom.name };
};

module.exports = {
  createClassroom,
  getClassrooms,
  addStudentToClassroom,
  getClassroomDetails,
  removeStudentFromClassroom,
  searchStudents,
  joinClassroomByCode
};
