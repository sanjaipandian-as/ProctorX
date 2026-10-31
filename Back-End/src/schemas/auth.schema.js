const { z } = require('zod');

const studentSignupSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128)
});

const teacherSignupSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
  staffId: z.string().trim().min(2, 'Staff ID is required').max(50)
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required').max(128)
});

const adminLoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required').max(128)
});

const studentProfileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).max(128).optional()
});

module.exports = {
  studentSignupSchema,
  teacherSignupSchema,
  loginSchema,
  adminLoginSchema,
  studentProfileUpdateSchema
};
