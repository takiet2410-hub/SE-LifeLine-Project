import { Types } from 'mongoose';
import { DonorProfile } from '../models/donor-profile.model';
import { Badge } from '../models/badge.model';
import { Appointment, AppointmentStatus } from '../../booking/models/appointment.model';
import { isFeatureEnabled } from '../../admin/services/admin-toggle.service';

export function calculateDonorLevel(xp: number): number {
  if (xp >= 2000) return 5;
  if (xp >= 1000) return 4;
  if (xp >= 500) return 3;
  if (xp >= 200) return 2;
  return 1;
}

export class GamificationService {
  /**
   * Process XP addition and achievement unlocking after successful blood donation
   */
  static async processDonationCompletion(
    donorUserId: string | Types.ObjectId,
    appointmentDate?: Date,
    session?: any
  ) {
    if (!(await isFeatureEnabled('gamification_badges'))) return;
    const opts = session ? { session } : {};
    const donorId = typeof donorUserId === 'string' ? new Types.ObjectId(donorUserId) : donorUserId;

    // 1. Find DonorProfile
    let profile = await DonorProfile.findOne(
      { $or: [{ userId: donorId }, { _id: donorId }] },
      null,
      opts
    );
    if (!profile) return;

    // 2. Count total completed appointments
    const allDonorIds = [donorId, profile.userId, profile._id].filter(Boolean);
    const completedCount = await Appointment.countDocuments({
      donorId: { $in: allDonorIds },
      status: AppointmentStatus.Completed
    }).session(session || null);

    // 3. Award XP (+250 XP per donation)
    const xpReward = 250;
    const newXp = (profile.xp || 0) + xpReward;
    const newLevel = calculateDonorLevel(newXp);
    const updatedTotalDonations = Math.max(profile.totalDonations || 0, completedCount);
    const updatedLastDonationDate = appointmentDate || new Date();

    profile.xp = newXp;
    profile.donorLevel = newLevel;
    profile.totalDonations = updatedTotalDonations;
    profile.lastDonationDate = updatedLastDonationDate;

    await profile.save(opts);

    // 4. Evaluate & unlock achievements
    const badgeDefinitions = [
      {
        badgeType: 'FirstDonation',
        title: 'First Drop',
        description: 'Hoàn thành lần hiến máu đầu tiên',
        icon: '🩸',
        condition: updatedTotalDonations >= 1
      },
      {
        badgeType: 'SilverDonor',
        title: 'Silver Donor',
        description: 'Đạt mốc 200 XP đóng góp',
        icon: '🏅',
        condition: newXp >= 200
      },
      {
        badgeType: 'PromptDonor',
        title: 'Prompt Donor',
        description: 'Hoàn thành 3 lần hiến máu',
        icon: '🕒',
        condition: updatedTotalDonations >= 3
      },
      {
        badgeType: 'FiveDonations',
        title: 'Loyal Donor',
        description: 'Hoàn thành 5 lần hiến máu',
        icon: '🎖️',
        condition: updatedTotalDonations >= 5
      },
      {
        badgeType: 'GallonClub',
        title: 'Gallon Club',
        description: 'Hoàn thành 8 lần hiến máu',
        icon: '🥛',
        condition: updatedTotalDonations >= 8
      },
      {
        badgeType: 'EmergencyResponder',
        title: 'Emergency Responder',
        description: 'Hoàn thành 10 lần hiến máu hoặc tham gia ứng cứu khẩn cấp',
        icon: '⭐',
        condition: updatedTotalDonations >= 10
      }
    ];

    const existingBadges = profile.achievements || [];
    const existingTypes = new Set(existingBadges.map(b => b.badgeType));
    let isProfileModified = false;

    for (const def of badgeDefinitions) {
      if (def.condition && !existingTypes.has(def.badgeType)) {
        if (!profile.achievements) {
          profile.achievements = [];
        }
        profile.achievements.push({
          badgeType: def.badgeType,
          title: def.title,
          description: def.description,
          icon: def.icon,
          awardedAt: new Date()
        });
        existingTypes.add(def.badgeType);
        isProfileModified = true;

        try {
          const newBadge = new Badge({
            donorId,
            badgeType: def.badgeType,
            title: def.title,
            description: def.description,
            icon: def.icon,
            awardedAt: new Date()
          });
          await newBadge.save(opts);
        } catch (err: any) {
          // Ignore duplicate key error if badge exists
        }
      }
    }

    if (isProfileModified) {
      await profile.save(opts);
    }
  }

  /**
   * Process XP addition when donor successfully checks in
   */
  static async processCheckInBonus(
    donorUserId: string | Types.ObjectId,
    session?: any
  ) {
    if (!(await isFeatureEnabled('gamification_badges'))) return;
    const opts = session ? { session } : {};
    const donorId = typeof donorUserId === 'string' ? new Types.ObjectId(donorUserId) : donorUserId;

    let profile = await DonorProfile.findOne(
      { $or: [{ userId: donorId }, { _id: donorId }] },
      null,
      opts
    );
    if (!profile) return;

    const xpReward = 50;
    const newXp = (profile.xp || 0) + xpReward;
    const newLevel = calculateDonorLevel(newXp);

    profile.xp = newXp;
    profile.donorLevel = newLevel;

    await profile.save(opts);
  }

  /**
   * Get donor earned badges
   */
  static async getDonorBadges(donorUserId: string | Types.ObjectId) {
    const donorId = typeof donorUserId === 'string' ? new Types.ObjectId(donorUserId) : donorUserId;
    return await Badge.find({ donorId }).sort({ awardedAt: -1 }).lean();
  }
}
