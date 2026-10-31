const { z } = require('zod');

const rejectTeacherSchema = z.object({
  reason: z.string().trim().min(1).max(500).optional()
});

const toggleAiAccessSchema = z.object({
  enabled: z.boolean()
});

const createTeacherSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  staffId: z.string().trim().min(2).max(50)
});

module.exports = { rejectTeacherSchema, toggleAiAccessSchema, createTeacherSchema };
