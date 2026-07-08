const dotenv = require('dotenv');
const { z } = require('zod');

dotenv.config();

const envSchema = z.object({
  PORT: z.string().transform(val => parseInt(val, 10)).default('8000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(1),
  EMAIL_HOST: z.string().min(1),
  EMAIL_PORT: z.string().transform(val => parseInt(val, 10)).default('587'),
  EMAIL_USER: z.string().min(1),
  EMAIL_PASS: z.string().min(1),
  EMAIL_FROM: z.string().email(),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  UPSTASH_REDIS_REST_URL: z.string().url().optional().or(z.literal('')),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional().or(z.literal('')),
  ADMIN_USERNAME: z.string().min(1).default('admin'),
  ADMIN_PASSWORD: z.string().min(1).default('adminpassword'),
  MAX_WARNINGS: z.string().transform(val => parseInt(val, 10)).default('5')
});

const cleanEnv = envSchema.safeParse(process.env);

if (!cleanEnv.success) {
  console.error('Invalid environment variables:', cleanEnv.error.format());
  process.exit(1);
}

module.exports = cleanEnv.data;
