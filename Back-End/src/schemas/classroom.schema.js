const { z } = require('zod');

const createClassroomSchema = z.object({
  name: z.string().trim().min(2).max(100)
});

const addStudentSchema = z.object({
  email: z.string().email()
});

const joinClassroomSchema = z.object({
  code: z.string().trim().regex(/^CL-[A-Z0-9]{6}$/)
});

module.exports = { createClassroomSchema, addStudentSchema, joinClassroomSchema };
