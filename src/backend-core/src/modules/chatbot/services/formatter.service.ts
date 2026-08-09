import { Types } from 'mongoose';
import { DonorProfile } from '../../auth-account/models/donor-profile.model';
import { Campaign } from '../../campaign/models/campaign.model';

export class FormatterService {
  /**
   * Prepares a strict whitelist of donor context & campaign suggestions to send to AI Service.
   * Excludes sensitive personal fields (phone, CCCD, home address, etc.)
   */
  public static async prepareDonorContext(donorId: string | null) {
    // 1. Fetch available active and upcoming campaigns for both guests and authenticated donors
    let formattedCampaigns: any[] = [];
    try {
      const campaigns = await Campaign.find({
        status: { $in: ['Active', 'Upcoming'] }
      })
        .sort({ startDateTime: 1 })
        .limit(5)
        .lean();

      formattedCampaigns = campaigns.map(c => ({
        id: c._id.toString(),
        name: c.name,
        venue: c.venue,
        fullAddress: c.fullAddress,
        startDate: c.startDateTime ? new Date(c.startDateTime).toISOString().split('T')[0] : '',
        endDate: c.endDateTime ? new Date(c.endDateTime).toISOString().split('T')[0] : '',
        targetBloodGroups: c.targetBloodGroups || [],
        remainingSlots: Math.max(0, (c.capacity || 0) - (c.registeredCount || 0)),
        status: c.status
      }));
    } catch (err) {
      console.error('[FormatterService] Failed to fetch campaigns for donor context:', err);
    }

    if (!donorId || !Types.ObjectId.isValid(donorId)) {
      return {
        isAuthenticated: false,
        availableCampaigns: formattedCampaigns
      };
    }

    const donor = await DonorProfile.findOne({ userId: donorId });
    if (!donor) {
      return {
        isAuthenticated: false,
        availableCampaigns: formattedCampaigns
      };
    }

    // Next eligible date: 84 days after last donation
    let nextEligibleDate: string | null = null;
    let isEligibleNow = true;
    let daysUntilEligible = 0;

    if (donor.lastDonationDate) {
      const nextDate = new Date(donor.lastDonationDate);
      nextDate.setDate(nextDate.getDate() + 84);
      nextEligibleDate = nextDate.toISOString();

      const now = new Date();
      if (now < nextDate) {
        isEligibleNow = false;
        const diffTime = nextDate.getTime() - now.getTime();
        daysUntilEligible = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    }

    return {
      isAuthenticated: true,
      bloodType: donor.bloodType || 'Chưa cập nhật',
      donorLevel: donor.donorLevel || 'Thành viên',
      totalDonations: donor.totalDonations || 0,
      lastDonationDate: donor.lastDonationDate ? donor.lastDonationDate.toISOString().split('T')[0] : null,
      nextEligibleDate: nextEligibleDate ? nextEligibleDate.split('T')[0] : null,
      isEligibleNow: isEligibleNow,
      daysUntilEligible: daysUntilEligible,
      isEmergencyOptIn: !!donor.emergencyOptIn,
      availableCampaigns: formattedCampaigns
    };
  }

  /**
   * Appends medical disclaimer to the final AI response
   */
  public static appendMedicalDisclaimer(responseText: string): string {
    const disclaimer = "\n\n*Lưu ý: Các tư vấn y tế trên chỉ mang tính chất tham khảo. Vui lòng hỏi ý kiến bác sĩ để có chẩn đoán chính xác nhất.*";
    if (!responseText.includes('Lưu ý: Các tư vấn y tế')) {
      return responseText + disclaimer;
    }
    return responseText;
  }
}

