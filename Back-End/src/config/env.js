const dotenv = require('dotenv');
const { z } = require('zod');

dotenv.config();

const isTest = process.env.NODE_ENV === 'test';
const isProduction = process.env.NODE_ENV === 'production';

// In test mode, external service credentials are optional with dummy defaults.
// This allows CI/CD to run integration tests without real email/cloudinary/redis secrets.
const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(8000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: isProduction ? z.string().url() : z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: isTest ? z.string().min(1) : z.string().min(32),
  EMAIL_HOST: isTest ? z.string().default('smtp.test.local') : z.string().min(1),
  EMAIL_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  EMAIL_USER: isTest ? z.string().default('test@test.local') : z.string().min(1),
  EMAIL_PASS: isTest ? z.string().default('testpass') : z.string().min(1),
  EMAIL_FROM: isTest ? z.string().default('test@test.local') : z.string().email(),
  CLOUDINARY_CLOUD_NAME: isTest ? z.string().default('test_cloud') : z.string().min(1),
  CLOUDINARY_API_KEY: isTest ? z.string().default('test_key') : z.string().min(1),
  CLOUDINARY_API_SECRET: isTest ? z.string().default('test_secret') : z.string().min(1),
  UPSTASH_REDIS_REST_URL: isProduction ? z.string().url() : z.string().url().optional().or(z.literal('')),
  UPSTASH_REDIS_REST_TOKEN: isProduction ? z.string().min(1) : z.string().optional().or(z.literal('')),
  ADMIN_USERNAME: z.string().min(1).default('admin'),
  ADMIN_PASSWORD: isProduction ? z.string().min(12) : z.string().min(1).default('change-me-in-development'),
  MAX_WARNINGS: z.coerce.number().int().min(1).max(100).default(5),
  AI_SERVICE_URL: isProduction ? z.string().url() : z.string().url().default('http://localhost:8001'),
  AI_GRADING_CONCURRENCY: z.coerce.number().int().min(1).max(20).default(3)
});

const cleanEnv = envSchema.safeParse(process.env);

if (!cleanEnv.success) {
  console.error('Invalid environment variables:', cleanEnv.error.format());
  process.exit(1);
}

module.exports = cleanEnv.data;
