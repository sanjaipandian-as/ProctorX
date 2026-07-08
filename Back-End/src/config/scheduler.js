const prisma = require('./database');
const { redis } = require('./redis');
const logger = require('../utils/logger');
const { generateOTP } = require('../utils/helpers');

const startScheduler = (io) => {
  logger.info('OTP and Quiz scheduler initialized.');

  setInterval(async () => {
    try {
      const now = new Date();

      // 1. Auto-start scheduled PENDING quizzes
      const pendingQuizzes = await prisma.quiz.findMany({
        where: {
          status: 'PENDING',
          scheduledAt: { not: null, lte: now },
          autoStart: true
        }
      });

      for (const quiz of pendingQuizzes) {
        const otpCode = generateOTP();
        const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

        await prisma.quiz.update({
          where: { id: quiz.id },
          data: {
            status: 'ACTIVE',
            startedAt: now,
            otp: otpCode,
            otpExpiresAt
          }
        });

        // Set cache
        await redis.setex(`otp:${quiz.quizId}`, 300, otpCode);
        await redis.del(`quiz:${quiz.quizId}`);

        // Broadcast starting state to general audience or rooms
        if (io) {
          io.to(`exam:${quiz.quizId}`).emit('exam:started', { quizId: quiz.quizId });
          // Notify admin feed
          io.to('admin:audit').emit('admin:event', {
            type: 'start',
            timestamp: new Date(),
            message: `Quiz "${quiz.title}" started automatically (OTP: ${otpCode})`
          });
        }

        logger.info(`Auto-start: Quiz "${quiz.title}" (${quiz.quizId}) activated successfully.`);
      }

      // 2. Manage ACTIVE quizzes OTP lifecycle (sliding 40% window)
      const activeQuizzes = await prisma.quiz.findMany({
        where: {
          status: 'ACTIVE',
          startedAt: { not: null }
        }
      });

      for (const quiz of activeQuizzes) {
        const totalDurationMs = quiz.durationInMinutes * 60 * 1000;
        const windowMs = totalDurationMs * 0.40; // 40% of time
        const elapsedMs = now.getTime() - new Date(quiz.startedAt).getTime();

        const isInWindow = elapsedMs < windowMs;

        if (isInWindow) {
          // If current OTP has expired or doesn't exist, regenerate a new 5-minute OTP
          const isOtpExpired = !quiz.otp || !quiz.otpExpiresAt || new Date(quiz.otpExpiresAt) <= now;
          if (isOtpExpired) {
            const newOtp = generateOTP();
            const newExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

            await prisma.quiz.update({
              where: { id: quiz.id },
              data: {
                otp: newOtp,
                otpExpiresAt: newExpiry
              }
            });

            await redis.setex(`otp:${quiz.quizId}`, 300, newOtp);
            await redis.del(`quiz:${quiz.quizId}`);

            if (io) {
              // Notify active room of updated OTP if needed
              io.to(`exam:${quiz.quizId}`).emit('exam:otp-regenerated', { otp: newOtp });
              io.to('admin:audit').emit('admin:event', {
                type: 'otp',
                timestamp: new Date(),
                message: `Quiz "${quiz.title}" OTP auto-regenerated (OTP: ${newOtp})`
              });
            }

            logger.info(`OTP Lifecycle: Quiz "${quiz.title}" (${quiz.quizId}) OTP auto-regenerated -> ${newOtp}`);
          }
        } else {
          // Exceeded 40% limit: invalidate and clear active OTP so no new students can join
          if (quiz.otp !== null) {
            await prisma.quiz.update({
              where: { id: quiz.id },
              data: {
                otp: null,
                otpExpiresAt: null
              }
            });

            await redis.del(`otp:${quiz.quizId}`);
            await redis.del(`quiz:${quiz.quizId}`);

            if (io) {
              io.to(`exam:${quiz.quizId}`).emit('exam:otp-expired');
              io.to('admin:audit').emit('admin:event', {
                type: 'otp',
                timestamp: new Date(),
                message: `Quiz "${quiz.title}" joining window closed (OTP cleared)`
              });
            }

            logger.info(`OTP Lifecycle: Quiz "${quiz.title}" (${quiz.quizId}) joining window closed.`);
          }
        }
      }
    } catch (err) {
      logger.error('Error inside background scheduler tick:', err);
    }
  }, 10000); // Run checker every 10 seconds for high responsiveness
};

module.exports = {
  startScheduler
};
