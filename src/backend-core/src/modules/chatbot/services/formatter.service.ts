import { Types } from 'mongoose';
import { DonorProfile } from '../../auth-account/models/donor-profile.model';
import { Campaign } from '../../campaign/models/campaign.model';
import { Appointment } from '../../booking/models/appointment.model';
import { BookingService } from '../../booking/services/booking.service';

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export class FormatterService {
  /**
   * Prepares a strict whitelist of donor context & campaign suggestions to send to AI Service.
   * Excludes sensitive personal fields (phone, CCCD, home address, etc.)
   */
  public static async prepareDonorContext(
    donorId: string | null,
    coords?: { lat?: number; lng?: number }
  ) {
    // 1. Fetch available active and upcoming campaigns using the same service as Schedule Page UI
    let formattedCampaigns: any[] = [];
    try {
      const validLocations = await BookingService.searchLocations({
        lat: coords?.lat,
        lng: coords?.lng
      });

      let sortedLocations = validLocations;
      if (coords?.lat !== undefined && coords?.lng !== undefined && !isNaN(coords.lat) && !isNaN(coords.lng)) {
        sortedLocations = [...validLocations].map((c: any) => {
          let dist = null;
          if (c.location?.coordinates && Array.isArray(c.location.coordinates) && c.location.coordinates.length === 2) {
            dist = calculateDistanceKm(
              coords.lat!,
              coords.lng!,
              c.location.coordinates[1],
              c.location.coordinates[0]
            );
          }
          return { ...c, distanceKm: dist };
        }).sort((a, b) => {
          if (a.distanceKm === null) return 1;
          if (b.distanceKm === null) return -1;
          return a.distanceKm - b.distanceKm;
        });
      }

      // Pick top 3 nearest and most relevant campaigns
      formattedCampaigns = sortedLocations.slice(0, 3).map((c: any) => ({
        id: c._id ? c._id.toString() : c.id,
        name: c.name,
        venue: c.venue || c.name,
        fullAddress: c.fullAddress || c.venue || c.name,
        startDate: c.startDateTime ? new Date(c.startDateTime).toISOString().split('T')[0] : '',
        endDate: c.endDateTime ? new Date(c.endDateTime).toISOString().split('T')[0] : '',
        targetBloodGroups: c.targetBloodGroups || [],
        remainingSlots: Math.max(0, (c.capacity || 0) - (c.registeredCount || 0)),
        distanceKm: c.distanceKm !== undefined ? c.distanceKm : null,
        status: c.status,
        scheduleUrl: 'http://localhost:5173/my-appointments/schedule/step-1'
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

    // Fetch appointment history
    let donationHistory: any[] = [];
    try {
      const appointments = await Appointment.find({ donorId })
        .populate('campaignId', 'name venue fullAddress')
        .sort({ appointmentDate: -1 })
        .limit(10)
        .lean();

      donationHistory = appointments.map((app: any) => ({
        date: app.appointmentDate ? new Date(app.appointmentDate).toISOString().split('T')[0] : '',
        status: app.status,
        campaignName: app.campaignId?.name || 'Chiến dịch',
        venue: app.campaignId?.venue || 'Địa điểm không xác định',
        address: app.campaignId?.fullAddress || '',
        donationVolume: app.donationVolume
      }));
    } catch (err) {
      console.error('[FormatterService] Failed to fetch appointment history:', err);
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
      availableCampaigns: formattedCampaigns,
      donationHistory: donationHistory
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

