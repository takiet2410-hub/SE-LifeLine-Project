// src/utils/email.util.ts
import { env } from '../config/env.config';

const SENDER_EMAIL = env.SENDER_EMAIL;
const SENDER_NAME = "LifeLine Support System"; // Tên dự án mới của bạn

/**
 * Hàm chung để gửi email qua Brevo API (Tương đương send_email_via_brevo)
 */
export const sendEmailViaBrevo = async (toEmail: string, subject: string, htmlContent: string): Promise<boolean> => {
  const url = "https://api.brevo.com/v3/smtp/email"; // Endpoint từ Python[cite: 32]
  
  const payload = {
    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
    to: [{ email: toEmail }],
    subject: subject,
    htmlContent: htmlContent
  }; // Cấu trúc JSON từ Python[cite: 32]

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'api-key': env.BREVO_API_KEY || '',
        'Content-Type': 'application/json'
      }, // Headers từ Python[cite: 32]
      body: JSON.stringify(payload)
    });

    if (response.status === 201) { // Check mã thành công từ Python[cite: 32]
      console.log(`✅ Đã gửi mail thành công tới ${toEmail}`);
      return true;
    } else {
      const errorData = await response.text();
      console.error(`❌ Lỗi gửi mail Brevo: ${errorData}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Lỗi kết nối Brevo:`, error);
    return false;
  }
};

/**
 * Hàm gửi xác thực tài khoản
 */
export const sendVerificationEmail = async (email: string, token: string) => {
  const verificationLink = `${env.FRONTEND_URL}/verify-email?token=${token}`;
  
  const subject = "[LifeLine] Kích hoạt tài khoản";
  const htmlContent = `
  <html>
      <body>
          <h2>Xin chào!</h2>
          <p>Cảm ơn bạn đã đăng ký trên hệ thống LifeLine. Vui lòng bấm vào link dưới để kích hoạt tài khoản:</p>
          <a href="${verificationLink}" style="padding: 10px 20px; background: #28a745; color: white; text-decoration: none; border-radius: 5px;">
              Kích hoạt ngay
          </a>
          <p>Hoặc copy link này: ${verificationLink}</p>
      </body>
  </html>
  `;
  
  return await sendEmailViaBrevo(email, subject, htmlContent);
};

/**
 * Hàm gửi quên mật khẩu
 */
export const sendResetEmail = async (email: string, otp: string) => {
  const subject = "[LifeLine] Mã xác nhận đặt lại mật khẩu";
  const htmlContent = `
  <html>
      <body>
          <h2>Yêu cầu đặt lại mật khẩu</h2>
          <p>Mã xác nhận (OTP) gồm 6 chữ số của bạn là:</p>
          <h1 style="color: #b91c1c; letter-spacing: 5px;">${otp}</h1>
          <p>Mã này sẽ hết hạn sau 15 phút. Vui lòng không chia sẻ cho bất kỳ ai.</p>
      </body>
  </html>
  `;
  
  return await sendEmailViaBrevo(email, subject, htmlContent);
};