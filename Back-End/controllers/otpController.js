import OTP from '../models/OTP.js';
import generateOTP from '../utils/otp.js';
import { sendOTPEmail } from '../utils/emailService.js';

export const requestOTP = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

  await OTP.findOneAndUpdate({ email }, { otp, expiresAt }, { upsert: true });

  try {
    await sendOTPEmail(email, otp);
    res.status(200).json({ message: "OTP sent to email" });
  } catch (err) {
    res.status(500).json({ message: "Failed to send OTP", error: err.message });
  }
};

export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: "Email and OTP required" });

  const record = await OTP.findOne({ email });
  if (!record) return res.status(400).json({ message: "No OTP requested for this email" });

  if (new Date() > record.expiresAt) {
    await OTP.deleteOne({ email });
    return res.status(400).json({ message: "OTP expired" });
  }

  if (record.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });

  await OTP.deleteOne({ email });
  res.status(200).json({ message: "OTP verified successfully" });
};
