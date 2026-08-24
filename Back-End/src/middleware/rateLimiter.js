const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  message: { message: 'Too many OTP requests. Please try again after 10 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// AI generation limiter — keyed by teacher ID (not IP, since lab settings share IPs)
// 5 quiz generations per 10 minutes per teacher account
const aiGenerationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  keyGenerator: (req) => req.user?.id || req.ip, // use authenticated teacher ID
  message: { message: 'AI generation limit reached. You can generate up to 5 quizzes per 10 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  loginLimiter,
  otpLimiter,
  aiGenerationLimiter
};

