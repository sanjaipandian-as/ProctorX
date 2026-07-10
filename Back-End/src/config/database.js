const { PrismaClient } = require('@prisma/client');
const env = require('./env');

// Connection pooling config can be passed in DATABASE_URL or constructor if supported.
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.DATABASE_URL
    }
  },
  log: env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error']
});

module.exports = prisma;
