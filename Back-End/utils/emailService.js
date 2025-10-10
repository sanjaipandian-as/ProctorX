import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendEmail = async ({ to, subject, text, html }) => {
    try {
        const info = await transporter.sendMail({
            from: `"ProctorX" <${process.env.EMAIL_FROM}>`,
            to: to,
            subject: subject,
            text: text,
            html: html,
        });
        console.log("Message sent via Brevo: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Email sending failed:", error);
        throw new Error("Email could not be sent.");
    }
};