import { Types } from 'mongoose';
import { SOSRequest } from '../models/sos-request.model';
import { SOSEvaluationLog } from '../models/sos-evaluation-log.model';
import { Hospital } from '../../auth-account/models/hospital.model';
import { BloodCenter } from '../../auth-account/models/blood-center.model';
import { DonorProfile } from '../../auth-account/models/donor-profile.model';
import { BloodBag } from '../../blood-inventory/models/blood-bag.model';
import { SOSBroadcastService } from './sos-broadcast.service';
import { getCompatibleDonorBloodTypes } from '../../../shared/blood-type.utils';

export class SOSEvaluationService {
  
  public static async evaluateAndPrioritize(sosRequestId: string, expandRadius: boolean = false) {
    console.log(`[SOSEvaluationService] Starting evaluation for SOS Request: ${sosRequestId}`);
    const request = await SOSRequest.findById(sosRequestId);
    if (!request) throw new Error('Request not found');
    
    // Get hospital location
    const hospital = await Hospital.findById(request.hospitalId);
    if (!hospital || !hospital.location || !hospital.location.coordinates) {
      throw new Error(`Hospital location is missing. Cannot perform GeoNear query. Hospital object: ${JSON.stringify(hospital)}`);
    }
    const [lng, lat] = hospital.location.coordinates;

    // Check if there is an existing eval log to determine current radius
    let currentRadiusKm = 10;
    let expansionCount = 0;
    
    if (expandRadius) {
      const lastLog = await SOSEvaluationLog.findOne({ sosRequestId }).sort({ evaluatedAt: -1 });
      if (lastLog) {
        currentRadiusKm = lastLog.searchRadiusKmUsed + 10;
        expansionCount = lastLog.radiusExpansionCount + 1;
        if (currentRadiusKm > 50) {
          console.log(`[SOSEvaluationService] Reached maximum search radius (50km)`);
          currentRadiusKm = 50; // Cap at 50km
        }
      }
    }

    request.status = 'EvaluationInProgress';
    await request.save();

    // Get list of compatible donor blood types for the requested blood type
    const compatibleTypes = getCompatibleDonorBloodTypes(request.bloodType);
    console.log(`[SOSEvaluationService] Requested blood type: ${request.bloodType}. Compatible donor blood types: [${compatibleTypes.join(', ')}]`);

    // 1. Evaluate Blood Centers (matching compatible blood bags)
    const bloodBags = await BloodBag.aggregate([
      { $match: { bloodType: { $in: compatibleTypes }, status: 'Available' } },
      { $group: { _id: '$bloodCenterId', totalVolume: { $sum: '$volumeMl' } } }
    ]);
    
    const centerInventoryMap = new Map();
    bloodBags.forEach(b => {
      if (b._id) centerInventoryMap.set(b._id.toString(), b.totalVolume);
    });

    // Find nearby blood centers
    const nearbyCenters = await BloodCenter.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distance',
          maxDistance: 50000, // max 50km for centers
          spherical: true,
          distanceMultiplier: 0.001 // Convert meters to km
        }
      }
    ]);

    const rankedCenters = nearbyCenters
      .map(c => {
        const inventory = centerInventoryMap.has(c._id.toString()) ? centerInventoryMap.get(c._id.toString()) : 0;
        const distance = c.distance || 1; // avoid div by 0
        const score = (inventory > 0 ? inventory : 0.1) / distance; // Simple heuristic, give minimum score if 0
        return {
          centerId: c._id,
          score,
          inventoryVolume: inventory,
          distanceKm: distance
        };
      })
      .sort((a, b) => b.score - a.score);

    // 2. Evaluate Donors (matching compatible donor blood types with exact-match priority)
    const nearbyDonors = await DonorProfile.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distance',
          maxDistance: currentRadiusKm * 1000, // current radius in meters
          spherical: true,
          distanceMultiplier: 0.001
        }
      },
      {
        $match: {
          bloodType: { $in: compatibleTypes },
          emergencyOptIn: true
        }
      }
    ]);

    const rankedDonors = nearbyDonors.map(d => {
      const distance = d.distance || 1;
      const isExactMatch = d.bloodType === request.bloodType;
      // Exact blood type matches get 1.0 weight multiplier, compatible types get 0.85 multiplier
      const compatibilityMultiplier = isExactMatch ? 1.0 : 0.85;
      const score = (((d.donorLevel || 1) * 10) / distance) * compatibilityMultiplier;
      return {
        donorId: d.userId || d._id,
        donorProfileId: d._id,
        score,
        distanceKm: distance,
        lastDonationDate: d.lastDonationDate,
        engagementTier: d.donorLevel || 1
      };
    }).sort((a, b) => b.score - a.score);

    // 3. Create Evaluation Log
    const evalLog = new SOSEvaluationLog({
      sosRequestId: request._id,
      rankedBloodCenters: rankedCenters,
      rankedDonors: rankedDonors,
      searchRadiusKmUsed: currentRadiusKm,
      radiusExpansionCount: expansionCount,
      evaluatedAt: new Date(),
      immutable: true
    });
    await evalLog.save();

    // 4. Trigger Broadcast (Async)
    SOSBroadcastService.broadcastAlert(request._id.toString()).catch(err => {
      console.error(`[SOSEvaluationService] Broadcast failed:`, err);
    });

    return evalLog;
  }
}
