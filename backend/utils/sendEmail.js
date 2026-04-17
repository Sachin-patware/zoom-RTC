import nodemailer from "nodemailer";

const getTransporter = () => {
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_APP_PASSWORD
        }
    });
};

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5174";
const FROM_NAME = "ZoomRTC";

export const sendVerificationEmail = async (email, otp) => {

    const mailOptions = {
        from: `"${FROM_NAME}" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Verify Your Email ─ ZoomRTC",
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0B0E14; border-radius: 16px; overflow: hidden; border: 1px solid #1E293B;">
                <div style="background: linear-gradient(135deg, #6366F1, #8B5CF6); padding: 40px 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ZoomRTC</h1>
                </div>
                <div style="padding: 40px 30px; color: #E2E8F0; text-align: center;">
                    <p style="font-size: 16px; line-height: 1.6;">Thanks for signing up! Enter the 6-digit code below to verify your email address:</p>
                    <div style="margin: 40px 0;">
                        <span style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); color: #818CF8; padding: 15px 30px; border-radius: 12px; font-weight: 800; font-size: 32px; letter-spacing: 6px;">
                            ${otp}
                        </span>
                    </div>
                    <p style="font-size: 14px; color: #94A3B8;">This code expires in 10 minutes. Do not share it with anyone.</p>
                </div>
            </div>
        `
    };

    const transporter = getTransporter();
    await transporter.sendMail(mailOptions);
};

export const sendResetPasswordEmail = async (email, token) => {
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

    const mailOptions = {
        from: `"${FROM_NAME}" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Reset Your Password — ZoomRTC",
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0B0E14; border-radius: 16px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #EF4444, #DC2626); padding: 40px 30px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
                </div>
                <div style="padding: 40px 30px; color: #E2E8F0;">
                    <p style="font-size: 16px; line-height: 1.6;">You requested a password reset. Click the button below to set a new password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background: linear-gradient(135deg, #EF4444, #DC2626); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    <p style="font-size: 14px; color: #94A3B8;">This link expires in 15 minutes. If you didn't request this, you can safely ignore this email.</p>
                </div>
            </div>
        `
    };

    const transporter = getTransporter();
    await transporter.sendMail(mailOptions);
};
