import { Types } from 'mongoose';
import { DonorProfile } from '../models/donor-profile.model';
import { Badge } from '../models/badge.model';
import { Appointment, AppointmentStatus } from '../../booking/models/appointment.model';
import { isFeatureEnabled } from '../../admin/services/admin-toggle.service';

export function calculateDonorLevel(xp: number): number {
  if (xp >= 10000) return 6; // Huyền Thoại
  if (xp >= 5000) return 5; // Kim Cương
  if (xp >= 2000) return 4; // Bạch Kim
  if (xp >= 1000) return 3;  // Vàng
  if (xp >= 500) return 2;  // Bạc
  return 1;                 // Đồng
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
        title: 'Giọt Đầu Tiên',
        description: 'Hoàn thành lần hiến máu đầu tiên',
        icon: '🩸',
        condition: updatedTotalDonations >= 1
      },
      {
        badgeType: 'Silver',
        title: 'Hạng Bạc',
        description: 'Đạt mốc 500 XP',
        icon: '🥈',
        condition: newXp >= 500
      },
      {
        badgeType: 'Gold',
        title: 'Hạng Vàng',
        description: 'Đạt mốc 1000 XP',
        icon: '🥇',
        condition: newXp >= 1000
      },
      {
        badgeType: 'Platinum',
        title: 'Hạng Bạch Kim',
        description: 'Đạt mốc 2000 XP',
        icon: '💎',
        condition: newXp >= 2000
      },
      {
        badgeType: 'Diamond',
        title: 'Hạng Kim Cương',
        description: 'Đạt mốc 5000 XP',
        icon: '👑',
        condition: newXp >= 5000
      },
      {
        badgeType: 'Legendary',
        title: 'Hạng Huyền Thoại',
        description: 'Đạt mốc 10000 XP',
        icon: '🌟',
        condition: newXp >= 10000
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
