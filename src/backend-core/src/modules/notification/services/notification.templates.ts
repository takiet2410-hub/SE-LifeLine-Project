import { NotificationTemplate } from '../models/NotificationTemplate';

export const DEFAULT_NOTIFICATION_TEMPLATES = [
  // Appointment Confirmed
  {
    eventType: 'AppointmentConfirmed',
    locale: 'vi',
    subject: 'Xác nhận lịch hiến máu thành công',
    bodyText: 'Chào {{donorName}},\n\nLịch hiến máu của bạn đã được xác nhận:\n- Chiến dịch: {{campaignName}}\n- Thời gian: {{appointmentDate}} {{appointmentTime}}\n- Địa điểm: {{locationName}}\n\nVui lòng đến đúng giờ và mang theo CCCD/CMND. Cảm ơn bạn đã hiến máu cứu người!\n\nTrân trọng,\nĐội ngũ LifeLine',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #93000b;">Xác nhận lịch hiến máu thành công</h2>
        <p>Chào <strong>{{donorName}}</strong>,</p>
        <p>Lịch hiến máu của bạn đã được xác nhận:</p>
        <ul style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
          <li><strong>Chiến dịch:</strong> {{campaignName}}</li>
          <li><strong>Thời gian:</strong> {{appointmentDate}} {{appointmentTime}}</li>
          <li><strong>Địa điểm:</strong> {{locationName}}</li>
        </ul>
        <p>Vui lòng đến đúng giờ và mang theo CCCD/CMND. Cảm ơn bạn đã hiến máu cứu người!</p>
        <p><a href="{{deepLink}}" style="display: inline-block; background: #93000b; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Xem chi tiết lịch hẹn</a></p>
        <hr style="margin: 20px 0;">
        <p style="font-size: 12px; color: #999;">Trân trọng,<br>Đội ngũ LifeLine</p>
      </div>
    `,
    channels: ['InApp', 'Email'],
    variables: ['donorName', 'campaignName', 'appointmentDate', 'appointmentTime', 'locationName', 'deepLink'],
  },

  // Appointment Reminder 24h
  {
    eventType: 'AppointmentReminder24h',
    locale: 'vi',
    subject: 'Nhắc nhở: Lịch hiến máu vào ngày mai',
    bodyText: 'Chào {{donorName}},\n\nĐây là lời nhắc nhở rằng bạn có lịch hiến máu vào ngày mai:\n- Chiến dịch: {{campaignName}}\n- Thời gian: {{appointmentTime}}\n- Địa điểm: {{locationName}}\n\nVui lòng:\n- Ăn uống bình thường, tránh đồ ăn quá no/hơi\n- Uống đủ nước\n- Mang theo CCCD/CMND\n- Ngủ đủ giấc\n\nTrân trọng,\nĐội ngũ LifeLine',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #93000b;">⏰ Nhắc nhở: Lịch hiến máu vào ngày mai</h2>
        <p>Chào <strong>{{donorName}}</strong>,</p>
        <p>Đây là lời nhắc nhở rằng bạn có lịch hiến máu vào <strong>ngày mai</strong>:</p>
        <ul style="background: #fff3cd; padding: 15px; border-radius: 8px; border: 1px solid #ffc107;">
          <li><strong>Chiến dịch:</strong> {{campaignName}}</li>
          <li><strong>Thời gian:</strong> {{appointmentTime}}</li>
          <li><strong>Địa điểm:</strong> {{locationName}}</li>
        </ul>
        <p><strong>Vui lòng chuẩn bị:</strong></p>
        <ul>
          <li>Ăn uống bình thường, tránh đồ ăn quá no/hơi</li>
          <li>Uống đủ nước (2-3 ly)</li>
          <li>Mang theo CCCD/CMND</li>
          <li>Ngủ đủ giấc (7-8 giờ)</li>
        </ul>
        <p><a href="{{deepLink}}" style="display: inline-block; background: #93000b; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Xem chi tiết</a></p>
      </div>
    `,
    channels: ['InApp', 'WebPush'],
    variables: ['donorName', 'campaignName', 'appointmentTime', 'locationName', 'deepLink'],
  },

  // Appointment Reminder 2h
  {
    eventType: 'AppointmentReminder2h',
    locale: 'vi',
    subject: '⚡ Nhắc nhở: Lịch hiến máu sau 2 giờ',
    bodyText: 'Chào {{donorName}},\n\nLịch hiến máu của bạn sẽ bắt đầu sau 2 giờ:\n- Chiến dịch: {{campaignName}}\n- Thời gian: {{appointmentTime}}\n- Địa điểm: {{locationName}}\n\nVui lòng đang trên đường đến điểm hiến máu. Cảm ơn bạn!\n\nTrân trọng,\nĐội ngũ LifeLine',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #dc3545;">⚡ Nhắc nhở khẩn: Lịch hiến máu sau 2 giờ</h2>
        <p>Chào <strong>{{donorName}}</strong>,</p>
        <p>Lịch hiến máu của bạn sẽ bắt đầu sau <strong>2 giờ</strong>:</p>
        <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 5px 0;"><strong>Chiến dịch:</strong> {{campaignName}}</p>
          <p style="margin: 5px 0;"><strong>Thời gian:</strong> {{appointmentTime}}</p>
          <p style="margin: 5px 0;"><strong>Địa điểm:</strong> {{locationName}}</p>
        </div>
        <p style="color: #dc3545; font-weight: bold;">Vui lòng đang trên đường đến điểm hiến máu!</p>
        <p><a href="{{deepLink}}" style="display: inline-block; background: #dc3545; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Mở bản đồ chỉ đường</a></p>
      </div>
    `,
    channels: ['InApp', 'WebPush'],
    variables: ['donorName', 'campaignName', 'appointmentTime', 'locationName', 'deepLink'],
  },

  // Campaign Published
  {
    eventType: 'CampaignPublished',
    locale: 'vi',
    subject: 'Chiến dịch hiến máu mới: {{campaignName}}',
    bodyText: 'Chào {{donorName}},\n\nChiến dịch hiến máu mới đã được mở đăng ký:\n- Tên: {{campaignName}}\n- Thời gian: {{startDate}} - {{endDate}}\n- Địa điểm: {{locationName}}\n- Nhóm máu cần: {{bloodTypes}}\n\nĐăng ký ngay hôm nay để cứu người!\n\nTrân trọng,\nĐội ngũ LifeLine',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #28a745;">🩸 Chiến dịch hiến máu mới</h2>
        <p>Chào <strong>{{donorName}}</strong>,</p>
        <p>Chiến dịch hiến máu mới đã được mở đăng ký:</p>
        <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px;">
          <p style="margin: 5px 0;"><strong>Tên:</strong> {{campaignName}}</p>
          <p style="margin: 5px 0;"><strong>Thời gian:</strong> {{startDate}} - {{endDate}}</p>
          <p style="margin: 5px 0;"><strong>Địa điểm:</strong> {{locationName}}</p>
          <p style="margin: 5px 0;"><strong>Nhóm máu cần:</strong> {{bloodTypes}}</p>
        </div>
        <p><a href="{{deepLink}}" style="display: inline-block; background: #28a745; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Đăng ký ngay</a></p>
        <hr style="margin: 20px 0;">
        <p style="font-size: 12px; color: #999;">Trân trọng,<br>Đội ngũ LifeLine</p>
      </div>
    `,
    channels: ['InApp', 'Email'],
    variables: ['donorName', 'campaignName', 'startDate', 'endDate', 'locationName', 'bloodTypes', 'deepLink'],
  },

  // Donor Eligibility Reached
  {
    eventType: 'DonorEligibilityReached',
    locale: 'vi',
    subject: 'Bạn đã đủ điều kiện hiến máu lại!',
    bodyText: 'Chào {{donorName}},\n\nChúc mừng! Bạn đã đủ 84 ngày kể từ lần hiến máu cuối cùng và hiện đã đủ điều kiện để hiến máu lại.\n\nHãy tìm một chiến dịch gần bạn và đăng ký hiến máu tiếp tục hành trình cứu người.\n\nTrân trọng,\nĐội ngũ LifeLine',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #28a745;">🎉 Bạn đã đủ điều kiện hiến máu lại!</h2>
        <p>Chào <strong>{{donorName}}</strong>,</p>
        <p>Chúc mừng! Bạn đã đủ <strong>84 ngày</strong> kể từ lần hiến máu cuối cùng và hiện đã đủ điều kiện để hiến máu lại.</p>
        <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px; text-align: center;">
          <p style="font-size: 24px; font-weight: bold; color: #155724; margin: 0;">✅ Đã đủ điều kiện</p>
        </div>
        <p>Hãy tìm một chiến dịch gần bạn và đăng ký hiến máu tiếp tục hành trình cứu người.</p>
        <p><a href="{{deepLink}}" style="display: inline-block; background: #28a745; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Tìm chiến dịch gần tôi</a></p>
      </div>
    `,
    channels: ['InApp', 'Email', 'WebPush'],
    variables: ['donorName', 'deepLink'],
  },

  // Profile Verified
  {
    eventType: 'ProfileVerified',
    locale: 'vi',
    subject: 'Hồ sơ của bạn đã được xác thực',
    bodyText: 'Chào {{donorName}},\n\nHồ sơ của bạn đã được xác thực thành công. Bạn giờ có thể đăng ký hiến máu và tham gia các chiến dịch.\n\nCảm ơn bạn đã hoàn thiện hồ sơ!\n\nTrân trọng,\nĐội ngũ LifeLine',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #28a745;">✅ Hồ sơ đã được xác thực</h2>
        <p>Chào <strong>{{donorName}}</strong>,</p>
        <p>Hồ sơ của bạn đã được <strong>xác thực thành công</strong>. Bạn giờ có thể đăng ký hiến máu và tham gia các chiến dịch.</p>
        <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px; text-align: center;">
          <p style="font-size: 18px; font-weight: bold; color: #155724; margin: 0;">✅ Đã xác thực</p>
        </div>
        <p>Cảm ơn bạn đã hoàn thiện hồ sơ!</p>
        <p><a href="{{deepLink}}" style="display: inline-block; background: #28a745; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Xem hồ sơ</a></p>
      </div>
    `,
    channels: ['InApp', 'Email'],
    variables: ['donorName', 'deepLink'],
  },

  // SOS Alert
  {
    eventType: 'SOSAlert',
    locale: 'vi',
    subject: '🚨 SOS KHẨN CẤP: Cần máu {{bloodType}} tại {{hospitalName}}',
    bodyText: '🚨 SOS KHẨN CẤP 🚨\n\nCần máu {{bloodType}} khẩn cấp tại {{hospitalName}}.\n\n- Yêu cầu: {{quantity}} đơn vị\n- Mức độ: {{urgencyLevel}}\n- Hạn chót: {{deadline}}\n- Bệnh nhân: {{patientReference}}\n\nNếu bạn có nhóm máu phù hợp và đủ điều kiện, vui lòng đến ngay.\n\nTrân trọng,\nHệ thống LifeLine',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f8d7da; border: 2px solid #f5c6cb; border-radius: 12px; padding: 20px; text-align: center;">
          <h1 style="color: #dc3545; margin: 0 0 10px;">🚨 SOS KHẨN CẤP</h1>
          <p style="font-size: 18px; font-weight: bold; color: #721c24; margin: 0;">Cần máu <span style="color: #dc3545;">{{bloodType}}</span> tại {{hospitalName}}</p>
        </div>
        
        <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin: 15px 0;">
          <p style="margin: 8px 0;"><strong>Yêu cầu:</strong> {{quantity}} đơn vị</p>
          <p style="margin: 8px 0;"><strong>Mức độ:</strong> <span style="color: #dc3545;">{{urgencyLevel}}</span></p>
          <p style="margin: 8px 0;"><strong>Hạn chót:</strong> {{deadline}}</p>
          <p style="margin: 8px 0;"><strong>Bệnh nhân:</strong> {{patientReference}}</p>
          <p style="margin: 8px 0;"><strong>Địa chỉ:</strong> {{hospitalAddress}}</p>
        </div>
        
        <p style="text-align: center; margin: 20px 0;">
          <a href="{{deepLink}}" style="display: inline-block; background: #dc3545; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold;">TÔI CÓ THỂ GIÚP</a>
        </p>
        
        <p style="font-size: 12px; color: #999;">Nếu bạn có nhóm máu phù hợp và đủ điều kiện (đủ 84 ngày), vui lòng đến ngay bộ phận truyền máu.</p>
      </div>
    `,
    channels: ['InApp', 'WebPush'],
    variables: ['bloodType', 'hospitalName', 'quantity', 'urgencyLevel', 'deadline', 'patientReference', 'hospitalAddress', 'deepLink'],
  },

  // SOS Response Confirmed
  {
    eventType: 'SOSResponseConfirmed',
    locale: 'vi',
    subject: 'Cảm ơn bạn đã phản hồi SOS: {{sosRequestId}}',
    bodyText: 'Chào {{donorName}},\n\nCảm ơn bạn đã xác nhận tham gia hỗ trợ yêu cầu SOS {{sosRequestId}}.\n\nThông tin chi tiết:\n- Bệnh viện: {{hospitalName}}\n- Địa chỉ: {{hospitalAddress}}\n- Yêu cầu đến trước: {{deadline}}\n- Mang theo: CCCD/CMND\n\nHãy đến đúng giờ để hỗ trợ kịp thời. Cảm ơn bạn đã cứu người!\n\nTrân trọng,\nHệ thống LifeLine',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #28a745;">✅ Cảm ơn bạn đã phản hồi SOS</h2>
        <p>Chào <strong>{{donorName}}</strong>,</p>
        <p>Cảm ơn bạn đã xác nhận tham gia hỗ trợ yêu cầu SOS <strong>{{sosRequestId}}</strong>.</p>
        
        <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px;">
          <p style="margin: 5px 0;"><strong>Bệnh viện:</strong> {{hospitalName}}</p>
          <p style="margin: 5px 0;"><strong>Địa chỉ:</strong> {{hospitalAddress}}</p>
          <p style="margin: 5px 0;"><strong>Yêu cầu đến trước:</strong> {{deadline}}</p>
          <p style="margin: 5px 0;"><strong>Mang theo:</strong> CCCD/CMND</p>
        </div>
        
        <p><a href="{{deepLink}}" style="display: inline-block; background: #28a745; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Chỉ đường đến bệnh viện</a></p>
        
        <hr style="margin: 20px 0;">
        <p style="font-size: 12px; color: #999;">Hãy đến đúng giờ để hỗ trợ kịp thời. Cảm ơn bạn đã cứu người!</p>
      </div>
    `,
    channels: ['InApp', 'Email'],
    variables: ['donorName', 'sosRequestId', 'hospitalName', 'hospitalAddress', 'deadline', 'deepLink'],
  },

  // SOS Request Fulfilled
  {
    eventType: 'SOSRequestFulfilled',
    locale: 'vi',
    subject: 'Yêu cầu SOS {{sosRequestId}} đã được đáp ứng',
    bodyText: 'Chào {{donorName}},\n\nYêu cầu SOS {{sosRequestId}} mà bạn đã phản hồi đã được đáp ứng đủ lượng máu cần thiết.\n\nCảm ơn bạn đã sẵn sàng hỗ trợ. Sự sẵn lòng của bạn là động lực lớn cho đội y tế.\n\nTrân trọng,\nHệ thống LifeLine',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 12px; padding: 20px; text-align: center;">
          <h1 style="color: #155724; margin: 0 0 10px;">🛡️ Yêu cầu SOS đã được đáp ứng</h1>
          <p style="color: #155724; font-size: 16px; margin: 0;">Đã thu đủ lượng máu cần thiết</p>
        </div>
        
        <p>Chào <strong>{{donorName}}</strong>,</p>
        <p>Yêu cầu SOS <strong>{{sosRequestId}}</strong> mà bạn đã phản hồi đã được đáp ứng đủ lượng máu cần thiết.</p>
        
        <p>Cảm ơn bạn đã sẵn sàng hỗ trợ. Sự sẵn lòng của bạn là động lực lớn cho đội y tế.</p>
        
        <p style="text-align: center; margin: 20px 0;">
          <a href="{{deepLink}}" style="display: inline-block; background: #28a745; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Xem chi tiết</a>
        </p>
      </div>
    `,
    channels: ['InApp', 'WebPush'],
    variables: ['donorName', 'sosRequestId', 'deepLink'],
  },

  // Appointment Cancelled
  {
    eventType: 'AppointmentCancelled',
    locale: 'vi',
    subject: 'Lịch hiến máu đã bị hủy: {{campaignName}}',
    bodyText: 'Chào {{donorName}},\n\nLịch hiến máu của bạn đã bị hủy:\n- Chiến dịch: {{campaignName}}\n- Thời gian: {{appointmentDate}} {{appointmentTime}}\n- Lý do: {{reason}}\n\nBạn có thể đăng ký lịch mới bất cứ lúc nào.\n\nTrân trọng,\nĐội ngũ LifeLine',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #dc3545;">❌ Lịch hiến máu đã bị hủy</h2>
        <p>Chào <strong>{{donorName}}</strong>,</p>
        <p>Lịch hiến máu của bạn đã bị hủy:</p>
        <ul style="background: #f8d7da; padding: 15px; border-radius: 8px;">
          <li><strong>Chiến dịch:</strong> {{campaignName}}</li>
          <li><strong>Thời gian:</strong> {{appointmentDate}} {{appointmentTime}}</li>
          <li><strong>Lý do:</strong> {{reason}}</li>
        </ul>
        <p>Bạn có thể đăng ký lịch mới bất cứ lúc nào.</p>
        <p><a href="{{deepLink}}" style="display: inline-block; background: #93000b; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Đăng ký lịch mới</a></p>
      </div>
    `,
    channels: ['InApp', 'Email'],
    variables: ['donorName', 'campaignName', 'appointmentDate', 'appointmentTime', 'reason', 'deepLink'],
  },

  // Eligibility Check Failed / Blood Test Failed
  {
    eventType: 'EligibilityCheckFailed',
    locale: 'vi',
    subject: 'Thông báo quan trọng về kết quả hiến máu',
    bodyText: 'Chào {{donorName}},\n\nChúng tôi vô cùng trân trọng tinh thần thiện nguyện của bạn.\n\nTuy nhiên, sau khi xét nghiệm mẫu máu, chúng tôi ghi nhận có một số bất thường. Để đảm bảo sức khỏe cho bạn và an toàn truyền máu, mẫu máu này không thể sử dụng.\n\nVui lòng đến ngay cơ sở y tế gần nhất hoặc liên hệ lại với trung tâm hiến máu để được tư vấn và thăm khám chi tiết.\n\nTrân trọng,\nĐội ngũ LifeLine',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 12px; padding: 20px; text-align: center;">
          <h1 style="color: #721c24; margin: 0 0 10px;">🩺 Thông báo kết quả xét nghiệm</h1>
        </div>
        
        <p>Chào <strong>{{donorName}}</strong>,</p>
        <p>Chúng tôi vô cùng trân trọng tinh thần thiện nguyện của bạn.</p>
        
        <div style="background: #fff3cd; border-radius: 8px; padding: 15px; margin: 15px 0;">
          <p style="margin: 5px 0; color: #856404;">Sau khi xét nghiệm mẫu máu, chúng tôi ghi nhận có một số bất thường. Để đảm bảo sức khỏe cho bạn và an toàn truyền máu, mẫu máu này không thể sử dụng.</p>
        </div>
        
        <p style="font-weight: bold; color: #dc3545;">Vui lòng đến ngay cơ sở y tế gần nhất hoặc liên hệ lại với trung tâm hiến máu để được tư vấn và thăm khám chi tiết.</p>
        
        <p><a href="{{deepLink}}" style="display: inline-block; background: #dc3545; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Xem chi tiết hồ sơ</a></p>
      </div>
    `,
    channels: ['InApp', 'Email'],
    variables: ['donorName', 'deepLink'],
  },

  // Donation Completed
  {
    eventType: 'DonationCompleted',
    locale: 'vi',
    subject: 'Cảm ơn bạn đã hiến máu thành công!',
    bodyText: 'Chào {{donorName}},\n\nCảm ơn bạn đã hiến máu thành công tại {{campaignName}}!\n\n- Lượng máu: {{volume}} ml\n- Nhóm máu: {{bloodType}}\n- Thời gian: {{donationDate}}\n\nLần hiến máu này có thể cứu sống đến 3 người. Cảm ơn bạn đã làm điều thiện!\n\nLần hiến máu tiếp theo bạn có thể thực hiện sau 84 ngày ({{nextEligibleDate}}).\n\nTrân trọng,\nĐội ngũ LifeLine',
    bodyHtml: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 12px; padding: 20px; text-align: center;">
          <h1 style="color: #155724; margin: 0 0 10px;">🩸 Cảm ơn bạn đã hiến máu!</h1>
          <p style="color: #155724; font-size: 18px; margin: 0;">Bạn vừa cứu sống đến 3 người</p>
        </div>
        
        <p>Chào <strong>{{donorName}}</strong>,</p>
        <p>Cảm ơn bạn đã hiến máu thành công tại <strong>{{campaignName}}</strong>!</p>
        
        <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin: 15px 0;">
          <p style="margin: 5px 0;"><strong>Lượng máu:</strong> {{volume}} ml</p>
          <p style="margin: 5px 0;"><strong>Nhóm máu:</strong> {{bloodType}}</p>
          <p style="margin: 5px 0;"><strong>Thời gian:</strong> {{donationDate}}</p>
        </div>
        
        <p>Lần hiến máu này có thể cứu sống đến <strong>3 người</strong>. Cảm ơn bạn đã làm điều thiện!</p>
        <p>Lần hiến máu tiếp theo bạn có thể thực hiện sau 84 ngày (<strong>{{nextEligibleDate}}</strong>).</p>
        
        <p><a href="{{deepLink}}" style="display: inline-block; background: #93000b; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Xem thành tích</a></p>
      </div>
    `,
    channels: ['InApp', 'Email'],
    variables: ['donorName', 'campaignName', 'volume', 'bloodType', 'donationDate', 'nextEligibleDate', 'deepLink'],
  },
];

export async function seedNotificationTemplates() {
  for (const template of DEFAULT_NOTIFICATION_TEMPLATES) {
    await NotificationTemplate.findOneAndUpdate(
      { eventType: template.eventType as any, locale: template.locale },
      { $set: template },
      { upsert: true, returnDocument: 'after' }
    );
  }
  console.log('[Seed] Default notification templates created/updated');
}