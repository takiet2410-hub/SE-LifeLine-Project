import { User } from '../modules/auth-account/models/user.model';
import { DonorProfile } from '../modules/auth-account/models/donor-profile.model';
import { NotificationPreference } from '../modules/notification/models/NotificationPreference';
import { SOSRequest } from '../modules/sos-request/models/sos-request.model';

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

    // 3. Repair DonorProfiles missing emergencyOptIn or having false despite active profile
    const optInResult = await DonorProfile.updateMany(
      { $or: [{ emergencyOptIn: { $exists: false } }, { emergencyOptIn: null }] },
      { $set: { emergencyOptIn: true } }
    );
    if (optInResult.modifiedCount > 0) {
      console.log(`[DB-SelfHealing] Repaired ${optInResult.modifiedCount} donor profiles with missing emergencyOptIn.`);
    }

    // 4. Repair & Geocode DonorProfiles based on their actual living/permanent address
    const { geocodeAddress } = await import('./geocoding.util');
    const allProfiles = await DonorProfile.find({});
    let geocodedCount = 0;

    for (const p of allProfiles) {
      const addrToGeocode =
        (p.currentAddress as any)?.fullAddress ||
        (typeof p.currentAddress === 'string' ? p.currentAddress : '') ||
        p.permanentAddress;

      const hasValidLocation =
        p.location &&
        Array.isArray(p.location.coordinates) &&
        p.location.coordinates.length === 2 &&
        typeof p.location.coordinates[0] === 'number' &&
        typeof p.location.coordinates[1] === 'number' &&
        !isNaN(p.location.coordinates[0]);

      if (!hasValidLocation && addrToGeocode) {
        const coords = await geocodeAddress(addrToGeocode);
        if (coords) {
          p.location = {
            type: 'Point',
            coordinates: coords
          } as any;
          p.emergencyOptIn = true;
          await p.save();
          geocodedCount++;
        }
      }
    }

    if (geocodedCount > 0) {
      console.log(`[DB-SelfHealing] Geocoded and updated coordinates for ${geocodedCount} donor profiles based on their addresses.`);
    }

    // 5. Keep exactly one notification preference per existing user, then enforce it at DB level.
    const preferenceGroups = await NotificationPreference.aggregate([
      { $sort: { updatedAt: -1 } },
      { $group: { _id: '$userId', ids: { $push: '$_id' }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
    ]);
    for (const group of preferenceGroups) {
      await NotificationPreference.deleteMany({ _id: { $in: group.ids.slice(1) } });
    }
    const validUserIds = await User.distinct('_id');
    const orphanPreferences = await NotificationPreference.deleteMany({ userId: { $nin: validUserIds } });
    const preferenceIndexes = await NotificationPreference.collection.indexes();
    const userIndex = preferenceIndexes.find((index) => index.name === 'userId_1');
    if (userIndex && !userIndex.unique) await NotificationPreference.collection.dropIndex('userId_1');
    await NotificationPreference.collection.createIndex({ userId: 1 }, { unique: true, name: 'userId_1' });
    if (preferenceGroups.length > 0 || orphanPreferences.deletedCount > 0) {
      console.log(`[DB-SelfHealing] Notification preferences: merged ${preferenceGroups.length} duplicate group(s), removed ${orphanPreferences.deletedCount} orphan(s).`);
    }

    // 6. Expire overdue requests immediately and repair quantity semantics for active SOS records.
    const now = new Date();
    await SOSRequest.updateMany(
      {
        status: { $in: ['Pending', 'EvaluationInProgress', 'NotificationsDispatched'] },
        fulfillmentDeadline: { $lte: now },
      },
      { $set: { status: 'Expired' } }
    );
    const activeSOSRequests = await SOSRequest.find({
      status: { $in: ['Pending', 'EvaluationInProgress', 'NotificationsDispatched', 'InventoryDispatched'] },
      fulfillmentDeadline: { $gt: now },
    });
    for (const request of activeSOSRequests) {
      const directVolume = (request.directDonations || []).reduce((sum, donation) => sum + (donation.volumeMl || 0), 0);
      const receivedShipmentVolume = (request.shipments || [])
        .filter((shipment) => shipment.status === 'Received')
        .reduce((sum, shipment) => sum + (shipment.volumeMl || 0), 0);
      const collectedShipmentVolume = (request.shipments || [])
        .filter((shipment) => shipment.status !== 'Cancelled')
        .reduce((sum, shipment) => sum + (shipment.volumeMl || 0), 0);
      const inTransitVolume = (request.shipments || [])
        .filter((shipment) => shipment.status === 'InTransit')
        .reduce((sum, shipment) => sum + (shipment.volumeMl || 0), 0);
      request.pledgedQuantityMl = (request.acceptedDonorIds || []).length * 250;
      request.collectedQuantityMl = directVolume + collectedShipmentVolume;
      request.receivedQuantityMl = directVolume + receivedShipmentVolume;
      request.inTransitQuantityMl = inTransitVolume;
      if (request.receivedQuantityMl >= request.requiredQuantityMl) request.status = 'Fulfilled';
      await request.save();
    }

    // 7. Repair BloodBags missing bloodCenterId or all marked Used
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
