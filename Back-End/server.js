const http = require('http');
const socketIo = require('socket.io');
const app = require('./src/app');
const env = require('./src/config/env');
const prisma = require('./src/config/database');
const registerSocketHandlers = require('./src/sockets/index');
const logger = require('./src/utils/logger');
const bcrypt = require('bcryptjs');
const { startScheduler } = require('./src/config/scheduler');

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Attach io to request object so we can trigger socket actions inside services/controllers
app.set('io', io);

// Register WebSocket namespaces and room behaviors
registerSocketHandlers(io);

let stopScheduler;

// Seed default administrator if not present
async function seedAdmin() {
  try {
    const adminCount = await prisma.admin.count();
    if (adminCount === 0) {
      const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 10);
      await prisma.admin.create({
        data: {
          username: env.ADMIN_USERNAME,
          passwordHash
        }
      });
      logger.info('Seeding: Default admin credentials registered in PostgreSQL.');
    }
  } catch (error) {
    logger.error('Failed to seed default administrator credentials:', error);
    throw error;
  }
}

async function bootstrap() {
  await prisma.$connect();
  await seedAdmin();
  stopScheduler = startScheduler(io);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(env.PORT, '0.0.0.0', () => {
      server.removeListener('error', reject);
      logger.info(`ProctorX Backend Server listening on port ${env.PORT} in ${env.NODE_ENV} environment.`);
      resolve();
    });
  });
}

async function shutdown(signal) {
  logger.info(`Received ${signal}; shutting down gracefully.`);
  stopScheduler?.();
  await new Promise(resolve => io.close(() => server.close(resolve)));
  await prisma.$disconnect();
  process.exit(0);
}

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));

bootstrap().catch(async (error) => {
  logger.error('Backend startup failed:', error);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
