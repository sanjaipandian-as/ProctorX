const dotenv = require('dotenv');
const { z } = require('zod');

dotenv.config();

const isTest = process.env.NODE_ENV === 'test';

// In test mode, external service credentials are optional with dummy defaults.
// This allows CI/CD to run integration tests without real email/cloudinary/redis secrets.
const envSchema = z.object({
  PORT: z.string().transform(val => parseInt(val, 10)).default('8000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  EMAIL_HOST: isTest ? z.string().default('smtp.test.local') : z.string().min(1),
  EMAIL_PORT: z.string().transform(val => parseInt(val, 10)).default('587'),
  EMAIL_USER: isTest ? z.string().default('test@test.local') : z.string().min(1),
  EMAIL_PASS: isTest ? z.string().default('testpass') : z.string().min(1),
  EMAIL_FROM: isTest ? z.string().default('test@test.local') : z.string().email(),
  CLOUDINARY_CLOUD_NAME: isTest ? z.string().default('test_cloud') : z.string().min(1),
  CLOUDINARY_API_KEY: isTest ? z.string().default('test_key') : z.string().min(1),
  CLOUDINARY_API_SECRET: isTest ? z.string().default('test_secret') : z.string().min(1),
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
