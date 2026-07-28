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
  const verificationLink = `${env.FRONTEND_URL}/auth/verify-email?token=${token}`;
  
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

/**
 * Hàm gửi email xác nhận lịch hẹn hiến máu kèm E-ticket cho người hiến máu
 */
export const sendBookingConfirmationEmail = async (
  email: string,
  donorName: string,
  campaignName: string,
  appointmentDate: string | Date,
  timeSlot: string,
  ticketCode: string,
  eTicketUrl: string
) => {
  const formattedDate = appointmentDate instanceof Date 
    ? appointmentDate.toLocaleDateString('vi-VN') 
    : new Date(appointmentDate).toLocaleDateString('vi-VN');

  const subject = `[LifeLine] Xác nhận lịch hẹn hiến máu thành công - Mã vé: ${ticketCode}`;
  const htmlContent = `
  <html>
      <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #be123c; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">LifeLine - Đặt Lịch Hiến Máu</h1>
          </div>
          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; padding: 24px;">
              <h2 style="color: #be123c; margin-top: 0;">Xin chào ${donorName},</h2>
              <p>Lịch hẹn hiến máu của bạn đã được Trung tâm Máu xác nhận thành công!</p>
              
              <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Thông Tin Lịch Hẹn</h3>
                  <p style="margin: 8px 0;"><strong>Chiến dịch:</strong> ${campaignName}</p>
                  <p style="margin: 8px 0;"><strong>Ngày hiến máu:</strong> ${formattedDate}</p>
                  <p style="margin: 8px 0;"><strong>Khung giờ:</strong> ${timeSlot}</p>
                  <p style="margin: 8px 0;"><strong>Mã E-Ticket:</strong> <span style="font-size: 18px; font-weight: bold; color: #be123c;">${ticketCode}</span></p>
              </div>

              ${eTicketUrl ? `
              <div style="text-align: center; margin: 24px 0;">
                  <p style="font-weight: bold; color: #334155;">Vui lòng xuất trình mã QR / E-ticket bên dưới khi đến điểm hiến máu:</p>
                  <img src="${eTicketUrl}" alt="E-Ticket QR Code" style="max-width: 250px; height: auto; border: 2px dashed #be123c; padding: 12px; border-radius: 8px; background-color: #ffffff;" />
                  <p style="margin-top: 8px;"><a href="${eTicketUrl}" target="_blank" style="color: #2563eb; text-decoration: underline;">Xem E-Ticket</a></p>
              </div>
              ` : ''}

              <p style="color: #64748b; font-size: 14px;">Cảm ơn bạn đã sẵn sàng chia sẻ giọt máu hồng vì cộng đồng.</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="margin: 0; text-align: center; color: #94a3b8; font-size: 13px;">Trân trọng,<br/><strong>Đội ngũ Trợ lý Hiến máu LifeLine</strong></p>
          </div>
      </body>
  </html>
  `;

  return await sendEmailViaBrevo(email, subject, htmlContent);
};

/**
 * Hàm gửi email thông báo từ chối / chưa đủ điều kiện cho người hiến máu
 */
export const sendBookingRejectionEmail = async (
  email: string,
  donorName: string,
  campaignName: string,
  appointmentDate: string | Date,
  reason?: string
) => {
  const formattedDate = appointmentDate instanceof Date 
    ? appointmentDate.toLocaleDateString('vi-VN') 
    : new Date(appointmentDate).toLocaleDateString('vi-VN');

  const subject = `[LifeLine] Thông báo về kết quả rà soát hồ sơ hiến máu - ${campaignName}`;
  const htmlContent = `
  <html>
      <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #1e293b; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">LifeLine - Đợt Tiếp Nhận Máu</h1>
          </div>
          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; padding: 24px;">
              <h2 style="color: #be123c; margin-top: 0;">Xin chào ${donorName},</h2>
              <p>Trung tâm Truyền máu xin chân thành cảm ơn sự đăng ký tham gia hiến máu của bạn.</p>
              
              <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 16px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #9f1239; border-bottom: 1px solid #fecdd3; padding-bottom: 8px;">Kết Quả Rà Soát Hồ Sơ</h3>
                  <p style="margin: 8px 0;"><strong>Chiến dịch:</strong> ${campaignName}</p>
                  <p style="margin: 8px 0;"><strong>Ngày đăng ký:</strong> ${formattedDate}</p>
                  <p style="margin: 8px 0; color: #be123c;"><strong>Ghi chú từ Bác sĩ:</strong> ${reason || 'Chưa đủ điều kiện sức khỏe hoặc thuộc trường hợp tạm hoãn hiến máu đợt này.'}</p>
              </div>

              <p style="color: #475569; font-size: 14px;">Bạn có thể đăng ký lại vào các đợt hiến máu tiếp theo sau khi thể trạng đã sẵn sàng.</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="margin: 0; text-align: center; color: #94a3b8; font-size: 13px;">Trân trọng,<br/><strong>Đội ngũ Trợ lý Y tế LifeLine</strong></p>
          </div>
      </body>
  </html>
  `;

  return await sendEmailViaBrevo(email, subject, htmlContent);
};