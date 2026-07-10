const crypto = require('crypto');

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateQuizId() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'QZ-';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function formatDate(date) {
  return new Date(date).toISOString().replace(/T/, ' ').replace(/\..+/, '');
}

module.exports = {
  generateOTP,
  generateQuizId,
  formatDate
};
