const crypto = require('crypto');

function generateOTP(length = 6) {
    const otp = crypto.randomInt(Math.pow(10, length - 1), Math.pow(10, length)).toString();
    return otp;
}

module.exports = { generateOTP };
