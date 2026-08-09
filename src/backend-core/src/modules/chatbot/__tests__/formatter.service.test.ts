import { FormatterService } from '../services/formatter.service';
import { DonorProfile } from '../../auth-account/models/donor-profile.model';
import { Campaign } from '../../campaign/models/campaign.model';

describe('FormatterService - Chatbot Donor Context & Privacy', () => {
  it('should format guest donor context correctly without authentication', async () => {
    jest.spyOn(Campaign, 'find').mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        {
          _id: '507f1f77bcf86cd799439011',
          name: 'Chiến dịch Giọt Hồng Hè 2026',
          venue: 'Bệnh viện Chợ Rẫy',
          fullAddress: '201B Nguyễn Chí Thanh, P.12, Q.5, TP.HCM',
          startDateTime: new Date('2026-08-15'),
          endDateTime: new Date('2026-08-20'),
          targetBloodGroups: ['O+', 'A+'],
          capacity: 100,
          registeredCount: 20,
          status: 'Active',
        },
      ]),
    } as any);

    const context = await FormatterService.prepareDonorContext(null);

    expect(context.isAuthenticated).toBe(false);
    expect(context.availableCampaigns).toHaveLength(1);
    expect(context.availableCampaigns[0].name).toBe('Chiến dịch Giọt Hồng Hè 2026');
    expect((context as any).phone).toBeUndefined();
    expect((context as any).identityNumber).toBeUndefined();
  });

  it('should compute next eligible date and exclude sensitive PII for authenticated donors', async () => {
    const mockDonor = {
      userId: '507f1f77bcf86cd799439012',
      bloodType: 'O+',
      donorLevel: 'Vàng',
      totalDonations: 5,
      lastDonationDate: new Date('2026-07-01'), // Donated July 1, 2026 -> 84 days later is ~Sep 23, 2026
      phone: '0901234567',
      identityNumber: '123456789012',
      homeAddress: '123 Main St',
    };

    jest.spyOn(Campaign, 'find').mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
    } as any);

    jest.spyOn(DonorProfile, 'findOne').mockResolvedValue(mockDonor as any);

    const context = await FormatterService.prepareDonorContext('507f1f77bcf86cd799439012');

    expect(context.isAuthenticated).toBe(true);
    expect(context.bloodType).toBe('O+');
    expect(context.donorLevel).toBe('Vàng');
    expect(context.totalDonations).toBe(5);
    expect(context.lastDonationDate).toBe('2026-07-01');
    expect(context.nextEligibleDate).toBe('2026-09-23');

    // Strict privacy assertions: Sensitive info must NOT be present
    expect((context as any).phone).toBeUndefined();
    expect((context as any).identityNumber).toBeUndefined();
    expect((context as any).homeAddress).toBeUndefined();
  });

  it('should append medical disclaimer properly', () => {
    const rawText = 'Bạn có thể hiến máu nếu đáp ứng đủ các tiêu chuẩn sức khỏe.';
    const formatted = FormatterService.appendMedicalDisclaimer(rawText);
    expect(formatted).toContain('*Lưu ý: Các tư vấn y tế trên chỉ mang tính chất tham khảo.');

    // Duplicate call test
    const doubleFormatted = FormatterService.appendMedicalDisclaimer(formatted);
    const matches = doubleFormatted.match(/Lưu ý: Các tư vấn y tế/g);
    expect(matches?.length).toBe(1);
  });
});
