const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: env.EMAIL_PORT,
  secure: env.EMAIL_PORT === 465,
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS
  }
});

async function sendEmail({ to, subject, html }) {
  try {
    const info = await transporter.sendMail({
      from: `"${env.EMAIL_FROM.split('@')[0]}" <${env.EMAIL_FROM}>`,
      to,
      subject,
      html
    });
    logger.info(`Email sent successfully: ${info.messageId} to ${to}`);
    return true;
  } catch (error) {
    logger.error(`Error sending email to ${to}:`, error);
    return false;
  }
}

async function sendOTPEmail(email, name, otp, quizTitle) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #4f46e5; text-align: center;">ProctorX Quiz Access OTP</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>You have requested access to join the quiz <strong>"${quizTitle}"</strong>.</p>
      <p>Use the following One-Time Password (OTP) to verify your access:</p>
      <div style="background-color: #f3f4f6; text-align: center; padding: 15px; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #1e1b4b; border-radius: 6px; margin: 20px 0;">
        ${otp}
      </div>
      <p style="color: #ef4444; font-size: 14px;">Please note: This OTP is valid for 10 minutes only. Do not share this OTP with anyone.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="font-size: 12px; color: #6b7280; text-align: center;">ProctorX Secure Assessment Platform</p>
    </div>
  `;
  return sendEmail({ to: email, subject: `ProctorX OTP: ${otp} for ${quizTitle}`, html });
}

async function sendWelcomeEmail(email, name, role) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #4f46e5; text-align: center;">Welcome to ProctorX!</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Your account as a <strong>${role}</strong> has been successfully created.</p>
      ${role === 'teacher' ? '<p>Please wait for an administrator to approve your account. You will receive another notification email once your account has been approved.</p>' : '<p>You can now log in and take secure exams assigned by your instructors.</p>'}
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="font-size: 12px; color: #6b7280; text-align: center;">ProctorX Secure Assessment Platform</p>
    </div>
  `;
  return sendEmail({ to: email, subject: 'Welcome to ProctorX!', html });
}

async function sendApprovalEmail(email, name, approved, reason = '') {
  const status = approved ? 'Approved' : 'Rejected';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: ${approved ? '#10b981' : '#ef4444'}; text-align: center;">Account Registration: ${status}</h2>
      <p>Hello <strong>${name}</strong>,</p>
      ${approved 
        ? '<p>Congratulations! Your teacher account on ProctorX has been approved. You can now log in, create quizzes, and monitor live exams.</p>' 
        : `<p>We regret to inform you that your registration request was rejected.</p><p><strong>Reason:</strong> ${reason}</p>`
      }
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="font-size: 12px; color: #6b7280; text-align: center;">ProctorX Secure Assessment Platform</p>
    </div>
  `;
  return sendEmail({ to: email, subject: `ProctorX Registration: ${status}`, html });
}

module.exports = {
  sendOTPEmail,
  sendWelcomeEmail,
  sendApprovalEmail
};
