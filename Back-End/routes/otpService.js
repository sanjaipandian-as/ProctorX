import express from 'express';
import { generateOTP } from '../utils/otp.js';
import { sendEmail } from '../utils/emailService.js';
import OTP from '../models/OTP.js';
import { isAuthenticatedUser } from '../controllers/authController.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();


router.post('/send', isAuthenticatedUser, authorizeRoles('teacher'), async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const otpCode = generateOTP();
    const otpExpire = Date.now() + 5 * 60 * 1000; 

    try {
        await OTP.create({ email, code: otpCode, expiresAt: otpExpire });
        await sendEmail(email, 'ProctorX OTP Verification', `Your OTP is: ${otpCode}`);

        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to send OTP', error: error.message });
    }
});


router.post('/verify', async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: 'Email and OTP are required' });

    try {
        const otpRecord = await OTP.findOne({ email, code });
        if (!otpRecord) return res.status(400).json({ message: 'Invalid OTP' });

        if (otpRecord.expiresAt < Date.now()) {
            return res.status(400).json({ message: 'OTP expired' });
        }

        await OTP.deleteOne({ _id: otpRecord._id });

        res.status(200).json({ message: 'OTP verified successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to verify OTP', error: error.message });
    }
});

export default router;
