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
import { Badge } from './models/badge.model';
import { geocodeAddress } from '../../shared/geocoding.util';

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
      if (existingUser.accountStatus === 'PendingVerification') {
        // Cho phép đăng ký lại nếu tài khoản trước đó chưa kích hoạt hoặc bị lỗi dở dang
        await DonorProfile.deleteOne({ userId: existingUser._id });
        await User.deleteOne({ _id: existingUser._id });
      } else {
        throw new Error('Email hoặc số CCCD này đã được đăng ký tài khoản trong hệ thống.');
      }
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
      roles: ['Donor'],
      role: 'Donor', 
      accountStatus: 'PendingVerification',
      verificationToken: verificationToken, // Lưu chuỗi thường
      verificationTokenExpiry: verificationTokenExpiry
    });

    await user.save();

    // Geocode address for SOS coordination (prioritizing currentAddress over permanentAddress)
    const effectiveAddress = data.currentAddress || addressString;
    const initialCoords = await geocodeAddress(effectiveAddress);

    // 4. Khởi tạo hồ sơ DonorProfile
    const profile = new DonorProfile({
      userId: user._id,
      fullName: fullName,
      dateOfBirth: dateOfBirth,
      idDocumentNumber: idDocumentNumber,
      phoneNumber: data.phoneNumber,
      permanentAddress: addressString,
      currentAddress: data.currentAddress ? { fullAddress: data.currentAddress } : undefined,
      location: initialCoords ? { type: 'Point', coordinates: initialCoords } : undefined,
      bloodType: 'Unknown',
      gender: mappedGender,
      email: data.email,

      // --- CÁC TRƯỜNG KHỞI TẠO MẶC ĐỊNH ---
      totalDonations: 0,
      xp: 0,
      donorLevel: 1, // Khởi tạo cấp độ 1 (Bronze/Starter)
      emergencyOptIn: true,
      avatarUrl: DEFAULT_AVATAR_URL
    });

    try {
      await profile.save();
    } catch (profileErr) {
      await User.deleteOne({ _id: user._id });
      throw profileErr;
    }

    try {
      await sendVerificationEmail(user.email, verificationToken); // Gửi chuỗi thường vào link
    } catch (error) {
      console.error("Lỗi gửi mail verification:", error);
    }

    return { message: 'Registration successful. Check email for verification link.' };
  }

  static async verifyEmail(token: string) {
    const user = await User.findOne({ 
      verificationToken: token 
    });
    
    if (!user) throw new Error('Invalid or expired token');

    if (user.accountStatus === 'Active') {
      return { message: 'Account is already verified. You can now sign in.' };
    }

    if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
      throw new Error('Verification link has expired. Please request a new verification email.');
    }

    user.accountStatus = 'Active';
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    
    await user.save();

    return { message: 'Account verified successfully. You can now sign in.' };
  }

  static async login(data: LoginInput) {
    const user = await User.findOne({
      $or: [{ idDocumentNumber: data.idDocumentNumber }, { email: data.idDocumentNumber }],
    });
    if (!user) throw new Error('Invalid credentials');

    if (user.accountStatus === 'Suspended') {
      if (user.lockUntil && user.lockUntil <= new Date()) {
        // Auto-unlock temporary lockout
        user.accountStatus = 'Active';
        user.lockUntil = undefined;
        user.failedLoginAttempts = 0;
        await user.save();
      } else {
        throw new Error('Tài khoản của bạn đã bị tạm khóa / đình chỉ. Vui lòng liên hệ Quản trị viên.');
      }
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

    // Consolidate all roles by scanning both user.role and user.roles array in database
    const userRoles = Array.from(
      new Set([
        user.role,
        ...(Array.isArray(user.roles) ? user.roles : [])
      ].filter(Boolean))
    );
    const activeRole = data.role || user.role;

    // Strict Mandatory Role Check: Reject login if requested role does not match DB role
    if (data.role && !userRoles.includes(data.role as any)) {
      throw new Error('Tài khoản của bạn chưa được cấp quyền truy cập với vai trò này.');
    }

    // Reset attempts on successful login
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    try {
      await user.save();
    } catch (saveErr) {
      await User.updateOne(
        { _id: user._id },
        { $set: { failedLoginAttempts: 0 }, $unset: { lockUntil: 1 } }
      ).catch(() => {});
    }

    const accessToken = jwt.sign(
      { userId: user._id, idDocumentNumber: user.idDocumentNumber, role: activeRole },
      env.JWT_SECRET,
      { expiresIn: '30m' }
    );

    const profile = await DonorProfile.findOne({ userId: user._id }).lean();

    return {
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        idDocumentNumber: user.idDocumentNumber,
        fullName: profile?.fullName || user.fullName || '',
        role: activeRole,
        roles: userRoles,
        hospitalId: user.hospitalId,
        bloodCenterId: user.bloodCenterId,
      }
    };
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

    // --- XỬ LÝ CẬP NHẬT EMAIL ---
    if (data.email) {
      // 1. Kiểm tra xem email mới này đã có ai dùng chưa (tránh trùng lặp)
      const existingUser = await User.findOne({ email: data.email, _id: { $ne: userId } });
      if (existingUser) {
        throw new Error('Email này đã được sử dụng bởi một tài khoản khác');
      }

      // 2. Cập nhật vào DonorProfile
      profile.email = data.email;

      // 3. Đồng bộ cập nhật sang collection User (quan trọng để hàm forgotPassword chạy đúng)
      await User.findByIdAndUpdate(userId, { email: data.email });
    }

    // Cập nhật Số điện thoại
    if (data.phoneNumber) {
      // 1. Kiểm tra xem số điện thoại mới này đã có ai dùng chưa (tránh trùng lặp)
      // Lưu ý: Trường lưu số điện thoại trong collection User là 'phone'
      const existingUserByPhone = await User.findOne({ phone: data.phoneNumber, _id: { $ne: userId } });
      
      if (existingUserByPhone) {
        throw new Error('Số điện thoại này đã được sử dụng bởi một tài khoản khác');
      }

      // 2. Cập nhật vào DonorProfile
      profile.phoneNumber = data.phoneNumber;

      // 3. Đồng bộ cập nhật sang collection User
      await User.findByIdAndUpdate(userId, { phone: data.phoneNumber });
    }

    // Địa chỉ thường trú được cố định theo CCCD, chỉ cập nhật nếu hồ sơ chưa từng có
    if (data.permanentAddress && (!profile.permanentAddress || profile.permanentAddress === 'N/A')) {
      const { province, ward, street } = data.permanentAddress;
      profile.permanentAddress = `${street}, ${ward}, ${province}`;
    }

    // Cập nhật Địa chỉ hiện nay (Lưu dạng Object phân cấp theo schema bsonType: 'object')
    if (data.currentAddress) {
      profile.currentAddress = {
        province: data.currentAddress.province,
        ward: data.currentAddress.ward,
        street: data.currentAddress.street,
        fullAddress: `${data.currentAddress.street}, ${data.currentAddress.ward}, ${data.currentAddress.province}`
      };
    }

    // Auto geocode effective address for SOS coordination (prioritize currentAddress over permanentAddress)
    const addressToGeocode = profile.currentAddress?.fullAddress || profile.permanentAddress;
    if (addressToGeocode) {
      const coords = await geocodeAddress(addressToGeocode);
      if (coords) {
        profile.location = {
          type: 'Point',
          coordinates: coords
        };
      }
    }

    // Nếu có gửi link avatarUrl trực tiếp thông qua API này
    if (data.avatarUrl) {
      profile.avatarUrl = data.avatarUrl;
    }

    await profile.save();
    return profile;
  }

  static async getProfile(userId: string) {
    // 1. Lấy thông tin cơ bản từ collection users và donor_profiles
    const user = await User.findById(userId)
      .populate('hospitalId', 'name address contactPhone')
      .populate('bloodCenterId', 'name address contactPhone')
      .lean() as any;
    if (!user) throw new Error('Không tìm thấy tài khoản người dùng');

    const profile = await DonorProfile.findOne({ userId }).lean();
    if (!profile) {
      if (user.role !== 'Donor') {
        const staffName = user.fullName || `Cán bộ ${user.role}`;
        return {
          id: user._id,
          idDocumentNumber: user.idDocumentNumber,
          fullName: staffName,
          role: user.role,
          roles: user.roles,
          hospitalId: user.hospitalId?._id || user.hospitalId,
          hospital: user.hospitalId && typeof user.hospitalId === 'object' ? user.hospitalId : undefined,
          bloodCenterId: user.bloodCenterId?._id || user.bloodCenterId,
          bloodCenter: user.bloodCenterId && typeof user.bloodCenterId === 'object' ? user.bloodCenterId : undefined,
          profileInfo: {
            avatarUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150',
            fullName: staffName,
            memberSince: user.createdAt,
            currentAddress: 'Trung tâm Truyền máu Quốc gia',
            bloodType: 'Staff'
          },
          personalInfo: {
            idDocumentNumber: user.idDocumentNumber,
            fullName: staffName,
            dateOfBirth: new Date('1990-01-01'),
            gender: 'Male',
            bloodType: 'N/A'
          },
          contactInfo: {
            permanentAddress: 'Trung tâm Truyền máu TP.HCM',
            phoneNumber: user.phone || '0909123456',
            email: user.email
          },
          donationImpact: {
            totalDonations: 0,
            livesImpacted: 0,
            currentStreak: 0,
            status: 'Active Staff',
            xp: 0,
            donorLevel: 1
          }
        };
      }
      throw new Error('Không tìm thấy hồ sơ người hiến máu');
    }

    // 2. Query lịch sử hiến máu từ collection appointments & SOS direct donations
    const donorUserIds = [
      userId,
      profile._id,
      profile.userId,
      typeof userId === 'string' && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : null
    ].filter(Boolean);

    const completedAppointments = await Appointment.find({
      donorId: { $in: donorUserIds }, 
      status: AppointmentStatus.Completed
    }).sort({ appointmentDate: -1 }).populate('campaignId', 'name location address').lean();

    const stringUserIds = donorUserIds.map(id => id?.toString());
    let sosDonations: any[] = [];
    try {
      const { SOSRequest } = await import('../sos-request/models/sos-request.model');
      const sosList = await SOSRequest.find({
        'directDonations.donorId': { $in: donorUserIds }
      }).populate('hospitalId', 'name address').lean();
      for (const sos of sosList) {
        const matching = (sos.directDonations || []).filter((d: any) => stringUserIds.includes(d.donorId?.toString()));
        for (const m of matching) {
          sosDonations.push({
            ...m,
            hospitalName: (sos as any).hospitalName || (sos.hospitalId as any)?.name || (sos as any).patientReference || 'Bệnh viện tiếp nhận cấp cứu',
            sosRequestId: sos._id
          });
        }
      }
    } catch (err) {}

    // 3. Tính toán các chỉ số động cho UI
    const totalDonations = Math.max(completedAppointments.length + sosDonations.length, profile.totalDonations || 0);
    const completedDate = completedAppointments.length > 0 ? new Date(completedAppointments[0].appointmentDate) : null;
    const profileDate = profile.lastDonationDate ? new Date(profile.lastDonationDate) : null;

    let lastDonationDate: Date | null = null;
    if (completedDate && profileDate) {
      lastDonationDate = completedDate > profileDate ? completedDate : profileDate;
    } else {
      lastDonationDate = completedDate || profileDate || null;
    }
    
    // Y học thực tế: 1 đơn vị máu toàn phần có thể tách làm 3 chế phẩm (Hồng cầu, Huyết tương, Tiểu cầu) để cứu 3 người
    const livesImpacted = totalDonations * 3; 

    // Tính trạng thái hiến máu (Cấu hình bởi Admin trong SystemConfig, mặc định 84 ngày)
    let donationIntervalDays = 84;
    try {
      const { SystemConfig } = await import('../admin/models/system-config.model');
      const config = await SystemConfig.findOne({ key: 'donationIntervalDays' }).lean();
      if (config && typeof config.value === 'number') {
        donationIntervalDays = config.value;
      }
    } catch (e) {}

    let eligibilityStatus = 'Eligible Now';
    if (lastDonationDate) {
      const nextEligibleDate = new Date(lastDonationDate.getTime() + donationIntervalDays * 24 * 60 * 60 * 1000);
      const currentDate = new Date(); 
      
      if (currentDate < nextEligibleDate) {
        const day = String(nextEligibleDate.getDate()).padStart(2, '0');
        const month = String(nextEligibleDate.getMonth() + 1).padStart(2, '0');
        const year = nextEligibleDate.getFullYear();
        eligibilityStatus = `Eligible on ${day}/${month}/${year}`;
      }
    }

    // Tính toán Streak (Chuỗi hiến máu liên tiếp - Logic cơ bản: Nếu có hiến thì tính là 1)
    const currentStreak = totalDonations > 0 ? 1 : 0; 

    // 4. Query badges earned by user
    const badges = profile.achievements || [];

    // 5. Chuẩn bị danh sách Donation Timeline & XP Activity Log thống nhất
    const timelineItems = [
      ...completedAppointments.map(a => ({
        id: a._id.toString(),
        type: 'StandardDonation',
        title: 'Hiến máu toàn phần định kỳ',
        date: a.appointmentDate,
        locationName: (a.campaignId as any)?.name || 'Chiến dịch Hiến máu LifeLine',
        bloodType: profile.bloodType || 'O+',
        volume: '350 ml',
        status: 'completed',
        certificateNo: `CERT-${new Date(a.appointmentDate).getFullYear()}-LL${a._id.toString().slice(-6).toUpperCase()}`
      })),
      ...sosDonations.map(s => ({
        id: (s._id || s.fastTrackCode || Math.random()).toString(),
        type: 'SOSDirectDonation',
        title: 'Hiến máu cấp cứu khẩn cấp (SOS)',
        date: s.recordedAt || new Date(),
        locationName: s.hospitalName || 'Bệnh viện tiếp nhận cấp cứu',
        bloodType: s.bloodType || profile.bloodType || 'O+',
        volume: `${s.volumeMl || 250} ml`,
        status: 'completed',
        certificateNo: `CERT-SOS-${new Date(s.recordedAt || Date.now()).getFullYear()}-LL${(s.fastTrackCode || s._id?.toString() || '').slice(-6).toUpperCase()}`
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const xpLogs = [
      ...completedAppointments.map(a => ({
        id: a._id.toString(),
        activity: 'Hiến máu toàn phần (Chiến dịch)',
        date: a.appointmentDate,
        locationName: (a.campaignId as any)?.name || 'Chiến dịch Hiến máu LifeLine',
        xp: 250,
        impact: '♥️ x3'
      })),
      ...sosDonations.map(s => ({
        id: (s._id || s.fastTrackCode || Math.random()).toString(),
        activity: 'Ứng cứu hiến máu khẩn cấp SOS',
        date: s.recordedAt || new Date(),
        locationName: s.hospitalName || 'Bệnh viện tiếp nhận cấp cứu SOS',
        xp: 150,
        impact: '🛡️ Cứu sống ca SOS'
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 6. Định dạng dữ liệu trả về khớp hoàn toàn với thiết kế UI Frontend
    return {
      profileInfo: {
        avatarUrl: profile.avatarUrl,
        fullName: profile.fullName,
        memberSince: user.createdAt,
        currentAddress: profile.currentAddress?.fullAddress || profile.permanentAddress,
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
      donationTimeline: timelineItems,
      xpActivityLog: xpLogs,
      achievements: badges.map(b => ({
        badgeType: b.badgeType,
        title: b.title,
        description: b.description,
        icon: b.icon,
        awardedAt: b.awardedAt
      })).sort((a, b) => new Date(b.awardedAt).getTime() - new Date(a.awardedAt).getTime()),
      personalInfo: {
        idDocumentNumber: profile.idDocumentNumber,
        fullName: profile.fullName,
        dateOfBirth: profile.dateOfBirth,
        gender: profile.gender,
        bloodType: profile.bloodType
      },
      contactInfo: {
        permanentAddress: profile.permanentAddress,
        currentAddress: profile.currentAddress?.fullAddress || (typeof profile.currentAddress === 'string' ? profile.currentAddress : null),
        phoneNumber: profile.phoneNumber,
        email: profile.email
      }
    };
  }
}
