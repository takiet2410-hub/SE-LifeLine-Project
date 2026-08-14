import { User } from '../modules/auth-account/models/user.model';
import { DonorProfile } from '../modules/auth-account/models/donor-profile.model';

export async function runDatabaseSelfHealing(): Promise<void> {
  try {
    console.log('[DB-SelfHealing] Starting database data consistency check & auto-repair...');

    // 1. Repair Users with missing or empty `roles` array
    const usersWithoutRoles = await User.find({
      $or: [
        { roles: { $exists: false } },
        { roles: { $size: 0 } },
        { roles: null }
      ]
    });

    if (usersWithoutRoles.length > 0) {
      for (const u of usersWithoutRoles) {
        const primary = u.role || 'Donor';
        u.roles = [primary as any];
        if (!u.role) u.role = primary as any;
        await u.save();
      }
      console.log(`[DB-SelfHealing] Repaired ${usersWithoutRoles.length} users with missing 'roles' array.`);
    }

    // 2. Repair Users with missing primary `role`
    const usersWithoutPrimaryRole = await User.find({
      $or: [
        { role: { $exists: false } },
        { role: null }
      ]
    });

    if (usersWithoutPrimaryRole.length > 0) {
      for (const u of usersWithoutPrimaryRole) {
        const roles = Array.isArray(u.roles) && u.roles.length > 0 ? u.roles : ['Donor'];
        u.role = (roles[0] || 'Donor') as any;
        u.roles = roles as any;
        await u.save();
      }
      console.log(`[DB-SelfHealing] Repaired ${usersWithoutPrimaryRole.length} users with missing primary 'role'.`);
    }

    // 3. Repair DonorProfiles missing emergencyOptIn
    const optInResult = await DonorProfile.updateMany(
      { $or: [{ emergencyOptIn: { $exists: false } }, { emergencyOptIn: null }] },
      { $set: { emergencyOptIn: true } }
    );
    if (optInResult.modifiedCount > 0) {
      console.log(`[DB-SelfHealing] Repaired ${optInResult.modifiedCount} donor profiles with missing emergencyOptIn.`);
    }

    // 4. Repair DonorProfiles with invalid / empty location objects
    const allProfiles = await DonorProfile.find({ location: { $exists: true, $ne: null } });
    let fixedLocationsCount = 0;
    for (const p of allProfiles) {
      const coords = p.location?.coordinates;
      const isValid = Array.isArray(coords) &&
        coords.length === 2 &&
        typeof coords[0] === 'number' &&
        typeof coords[1] === 'number' &&
        !isNaN(coords[0]) &&
        !isNaN(coords[1]);

      if (!isValid) {
        await DonorProfile.updateOne({ _id: p._id }, { $unset: { location: "" } });
        fixedLocationsCount++;
      }
    }
    // 5. Repair BloodBags missing bloodCenterId or all marked Used
    const { BloodBag } = await import('../modules/blood-inventory/models/blood-bag.model');
    const { BloodCenter } = await import('../modules/auth-account/models/blood-center.model');
    const primaryCenter = await BloodCenter.findOne({});
    if (primaryCenter) {
      // Fix any bags with missing bloodCenterId
      await BloodBag.updateMany(
        { $or: [{ bloodCenterId: { $exists: false } }, { bloodCenterId: null }] },
        { $set: { bloodCenterId: primaryCenter._id } }
      );

      // If all blood bags are marked "Used" from previous testing, replenish them back to "Available"
      const availableCount = await BloodBag.countDocuments({ status: 'Available', bloodCenterId: primaryCenter._id });
      if (availableCount === 0) {
        const resetResult = await BloodBag.updateMany(
          {},
          { $set: { status: 'Available', bloodCenterId: primaryCenter._id } }
        );
        console.log(`[DB-SelfHealing] Replenished ${resetResult.modifiedCount} blood bags back to 'Available' for ${primaryCenter.name}`);
      }
    }

    console.log('[DB-SelfHealing] Database data consistency check completed successfully.');
  } catch (error) {
    console.error('[DB-SelfHealing] Warning: Error during database self-healing:', error);
  }
}
