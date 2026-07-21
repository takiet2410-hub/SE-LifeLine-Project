import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from './models/user.model';
import { DonorProfile } from './models/donor-profile.model';
import { env } from '../../config/env.config';
import { RegisterInput } from './schemas/register.schema';
import { LoginInput } from './schemas/login.schema';
import { ForgotPasswordInput, ResetPasswordInput } from './schemas/reset-password.schema';
import { UpdateProfileInput } from './schemas/update-profile.schema';
import crypto from 'crypto';
import { sendVerificationEmail, sendResetEmail } from '../../utils/email.util';
import { DEFAULT_AVATAR_URL } from '../../utils/cloudinary.util';
import { Appointment, AppointmentStatus } from '../booking/models/appointment.model';
export class AuthAccountService {
  
  static async register(data: RegisterInput) {
    // 1. Phân tách chuỗi payload
    const qrParts = data.qrPayload.split('|');
    if (qrParts.length < 7) {
      throw new Error('Invalid CCCD QR code format. Missing required fields.');
    }

    const idDocumentNumber = qrParts[0].trim();
    const fullName = qrParts[2].trim();
    const dobString = qrParts[3].trim(); 
    const genderString = qrParts[4].trim(); 
    const addressString = qrParts[5].trim(); 

    // Kiểm tra CCCD
    if (!/^\d{12}$/.test(idDocumentNumber)) {
      throw new Error('Invalid ID Document Number in QR payload.');
    }

    // Xử lý ngày sinh
    const day = dobString.substring(0, 2);
    const month = dobString.substring(2, 4);
    const year = dobString.substring(4, 8);
    const dateOfBirth = new Date(`${year}-${month}-${day}`);
    if (isNaN(dateOfBirth.getTime())) {
      throw new Error('Invalid Date of Birth in QR payload.');
    }

    let mappedGender: 'Male' | 'Female' | 'Other' = 'Other';
    if (genderString.toLowerCase() === 'nam') mappedGender = 'Male';
    else if (genderString.toLowerCase() === 'nữ') mappedGender = 'Female';

    // 2. Kiểm tra trùng lặp
    const existingUser = await User.findOne({ 
      $or: [{ email: data.email }, { idDocumentNumber: idDocumentNumber }] 
    });
    if (existingUser) {
      throw new Error('User with this email or ID Document already exists');
    }

    // 3. Khởi tạo tài khoản User
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);
    
    // Dùng UUID cho link xác minh (giống forgot password)
    const verificationToken = crypto.randomUUID(); 
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const user = new User({
      idDocumentNumber: idDocumentNumber,
      email: data.email,
      phone: data.phoneNumber, 
      passwordHash,
      role: 'Donor', 
      accountStatus: 'PendingVerification',
      verificationToken: verificationToken, // Lưu chuỗi thường
      verificationTokenExpiry: verificationTokenExpiry
    });

    await user.save();

    // 4. Khởi tạo hồ sơ DonorProfile
    const profile = new DonorProfile({
      userId: user._id,
      fullName: fullName,
      dateOfBirth: dateOfBirth,
      idDocumentNumber: idDocumentNumber,
      phoneNumber: data.phoneNumber, // Lấy từ input lưu vào collection donor_profiles[cite: 28]
      permanentAddress: addressString, 
      bloodType: 'Unknown', 
      gender: mappedGender,

      // --- CÁC TRƯỜNG KHỞI TẠO MẶC ĐỊNH ---
      totalDonations: 0,
      xp: 0,
      donorLevel: 1, // Khởi tạo cấp độ 1 (Bronze/Starter)
      emergencyOptIn: false,
      avatarUrl: DEFAULT_AVATAR_URL
      // BỎ ĐI 2 DÒNG DƯỚI ĐÂY ĐỂ TRÁNH LỖI MONGODB VALIDATION
      //location: {}, // Object trống theo schema, sau này có thể parse tọa độ
      //lastDonationDate: null // Chưa hiến lần nào
    });

    await profile.save();

    try {
      await sendVerificationEmail(user.email, verificationToken); // Gửi chuỗi thường vào link
    } catch (error) {
      console.error("Lỗi gửi mail verification:", error);
    }

    return { message: 'Registration successful. Check email for verification link.' };
  }

  static async verifyEmail(token: string) {
    // Tìm thẳng bằng token vì ta lưu chuỗi thường
    const user = await User.findOne({ 
        verificationToken: token, 
        accountStatus: 'PendingVerification' 
    });
    
    if (!user) throw new Error('Invalid or expired token');

    // Kiểm tra hết hạn (Nên có)
    if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
        throw new Error('Token has expired');
    }

    user.accountStatus = 'Active';
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    
    await user.save();

    return { message: 'Account verified successfully' };
  }

  static async login(data: LoginInput) {
    const user = await User.findOne({ idDocumentNumber: data.idDocumentNumber });
    if (!user) throw new Error('Invalid credentials');

    if (user.accountStatus === 'Suspended' && user.lockUntil && user.lockUntil > new Date()) {
      throw new Error('Account is suspended. Try again later.');
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 10) {
        user.accountStatus = 'Suspended';
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // lock for 15 mins
      }
      await user.save();
      throw new Error('Invalid credentials');
    }

    if (user.accountStatus === 'PendingVerification') {
      throw new Error('Account pending verification');
    }

    // Reset attempts on successful login
    user.failedLoginAttempts = 0;
    user.accountStatus = 'Active';
    user.lockUntil = undefined;
    await user.save();

    const accessToken = jwt.sign(
      { userId: user._id, idDocumentNumber: user.idDocumentNumber },
      env.JWT_SECRET,
      { expiresIn: '30m' }
    );

    return { accessToken, user: { id: user._id, email: user.email, idDocumentNumber: user.idDocumentNumber } };
  }


  static async forgotPassword(data: ForgotPasswordInput) {
    // 1. Tìm user theo idDocumentNumber (tương đương username ở DB cũ)
    const user = await User.findOne({ idDocumentNumber: data.idDocumentNumber });
    
    // 2. Kiểm tra tồn tại
    if (!user) {
      throw new Error('Tài khoản không tồn tại.'); // Custom Error Middleware sẽ bắt
    }

    // 3. Kiểm tra khớp Email
    if (user.email !== data.email) {
      throw new Error('Email cung cấp không khớp với tài khoản này.');
    }

    // 4. Tạo Reset OTP (6 chữ số)
    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // 5. Băm OTP trước khi lưu vào DB (bảo mật)
    const salt = await bcrypt.genSalt(10);
    user.resetToken = await bcrypt.hash(resetOtp, salt); // Vẫn dùng trường resetToken để lưu mã hash của OTP
    user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    // 6. Gửi Email chứa OTP gốc
    try {
      await sendResetEmail(user.email, resetOtp);
    } catch (error) {
      console.error("Lỗi gửi mail reset password:", error);
      throw new Error("Lỗi hệ thống gửi mail."); 
    }
    
    return { message: 'Đã gửi mã OTP. Vui lòng kiểm tra hộp thư.' };
  }

  static async resendForgotPassword(data: ForgotPasswordInput) {
    // Tái sử dụng logic của forgotPassword vì luồng cấp lại token giống hệt
    return await this.forgotPassword(data);
  }

  static async verifyResetOtp(data: { email: string, otp: string }) {
    const user = await User.findOne({ email: data.email });
    if (!user || !user.resetToken || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      throw new Error('OTP không hợp lệ hoặc đã hết hạn.');
    }

    // So sánh mã 6 số FE gửi lên với mã hash trong DB
    const isValid = await bcrypt.compare(data.otp, user.resetToken);
    if (!isValid) throw new Error('Mã OTP không chính xác.');

    // CHÌA KHÓA: Đổi OTP thành một Token (UUID) để dùng cho bước cuối
    const finalResetToken = crypto.randomUUID();
    user.resetToken = finalResetToken; // Ghi đè OTP bằng Token (không băm)
    await user.save();

    // Trả token này về cho FE để FE gọi tiếp API reset-password
    return { 
      message: 'OTP hợp lệ', 
      token: finalResetToken 
    };
  }

  static async resetPassword(data: ResetPasswordInput) {
    // 1. Tìm user có token này
    const user = await User.findOne({ resetToken: data.token });
    
    if (!user) {
      throw new Error('Token không hợp lệ hoặc đã sử dụng.');
    }

    // 2. Kiểm tra hạn sử dụng
    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      throw new Error('Token đã hết hạn.');
    }

    // 3. Kiểm tra pass nhập lại (Đã được xử lý tự động ở Zod Schema Middleware)
    
    // 4. Băm mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(data.newPassword, salt);

    // 5. Cập nhật & Xóa token
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    return { message: 'Đặt lại mật khẩu thành công. Hãy đăng nhập lại.' };
  }

  static async updateProfile(userId: string, data: UpdateProfileInput) {
    const profile = await DonorProfile.findOne({ userId });
    if (!profile) throw new Error('Profile not found');

    if (data.phoneNumber) profile.phoneNumber = data.phoneNumber;
    if (data.permanentAddress) profile.permanentAddress = data.permanentAddress;
    
    await profile.save();
    return profile;
  }

  static async getProfile(userId: string) {
    // 1. Lấy thông tin cơ bản từ collection users và donor_profiles
    const user = await User.findById(userId).lean();
    if (!user) throw new Error('Không tìm thấy tài khoản người dùng');

    const profile = await DonorProfile.findOne({ userId }).lean();
    if (!profile) throw new Error('Không tìm thấy hồ sơ người hiến máu');

    // 2. Query lịch sử hiến máu từ collection appointments
    // Vì donorId trong Appointment tham chiếu đến User._id, ta truyền thẳng userId vào đây
    const completedAppointments = await Appointment.find({
      donorId: userId, 
      status: AppointmentStatus.Completed // Dùng enum thay vì chuỗi string
    }).sort({ appointmentDate: -1 }).lean(); // Sắp xếp ngày hiến gần nhất lên đầu

    // 3. Tính toán các chỉ số động cho UI
    const totalDonations = completedAppointments.length;
    const lastDonationDate = totalDonations > 0 ? completedAppointments[0].appointmentDate : null;
    
    // Y học thực tế: 1 đơn vị máu toàn phần có thể tách làm 3 chế phẩm (Hồng cầu, Huyết tương, Tiểu cầu) để cứu 3 người
    const livesImpacted = totalDonations * 3; 

    // Tính trạng thái hiến máu (Cách nhau tối thiểu 12 tuần / 84 ngày đối với hiến máu toàn phần)
    let eligibilityStatus = 'Eligible Now';
    if (lastDonationDate) {
      const nextEligibleDate = new Date(lastDonationDate.getTime() + 84 * 24 * 60 * 60 * 1000);
      const currentDate = new Date(); 
      
      if (currentDate < nextEligibleDate) {
        eligibilityStatus = `Eligible on ${nextEligibleDate.toLocaleDateString('en-GB')}`; // Format dd/mm/yyyy
      }
    }

    // Tính toán Streak (Chuỗi hiến máu liên tiếp - Logic cơ bản: Nếu có hiến thì tính là 1)
    // Tương lai bạn có thể viết logic kiểm tra hiến máu đều đặn mỗi năm để tăng streak
    const currentStreak = totalDonations > 0 ? 1 : 0; 

    // 4. Định dạng dữ liệu trả về khớp hoàn toàn với thiết kế UI Frontend
    return {
      profileInfo: {
        avatarUrl: profile.avatarUrl,
        fullName: profile.fullName,
        memberSince: user.createdAt,
        location: profile.permanentAddress,
        bloodType: profile.bloodType
      },
      donationImpact: {
        totalDonations: totalDonations,
        livesImpacted: livesImpacted,
        currentStreak: currentStreak,
        status: eligibilityStatus,
        xp: profile.xp,
        donorLevel: profile.donorLevel
      },
      personalInfo: {
        idDocumentNumber: profile.idDocumentNumber,
        fullName: profile.fullName,
        dateOfBirth: profile.dateOfBirth,
        gender: profile.gender,
        bloodType: profile.bloodType
      },
      contactInfo: {
        permanentAddress: profile.permanentAddress,
        phoneNumber: profile.phoneNumber,
        email: profile.email
      }
    };
  }
}
