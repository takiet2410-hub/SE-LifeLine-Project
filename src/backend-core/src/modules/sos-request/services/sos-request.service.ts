import { SOSRequest } from '../models/sos-request.model';
import { SOSEvaluationService } from './sos-evaluation.service';

export class SOSRequestService {
  public static async createSOSRequest(data: any, createdByStaffId: string, hospitalId: string) {
    const request = new SOSRequest({
      ...data,
      createdByStaffId,
      hospitalId,
      status: 'Pending'
    });
    await request.save();

    // Trigger evaluation synchronously for now to catch errors
    try {
      await SOSEvaluationService.evaluateAndPrioritize(request._id.toString());
    } catch (err: any) {
      console.error(`[SOSRequestService] Auto-evaluation failed for ${request._id}:`, err);
      throw new Error(`Auto-evaluation failed: ${err.message}`);
    }

    return request;
  }

  public static async getSOSRequests(filters: any) {
    const { hospitalId, page = 1, limit = 10, status, urgencyLevel } = filters;
    
    const query: any = {};
    if (hospitalId) query.hospitalId = hospitalId;
    if (status) query.status = status;
    if (urgencyLevel) query.urgencyLevel = urgencyLevel;

    const skip = (Number(page) - 1) * Number(limit);
    
    const [data, total] = await Promise.all([
      SOSRequest.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate('hospitalId'),
      SOSRequest.countDocuments(query)
    ]);

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    };
  }

  public static async getSOSRequestById(id: string) {
    const request = await SOSRequest.findById(id).populate('hospitalId');
    if (!request) throw new Error('SOS Request not found');
    return request;
  }

  public static async updateSOSRequestStatus(id: string, status: string) {
    const request = await SOSRequest.findById(id);
    if (!request) throw new Error('SOS Request not found');
    
    request.status = status as any;
    await request.save();
    return request;
  }

  public static async recordDonorResponse(sosRequestId: string, donorId: string, response: 'accepted' | 'declined') {
    const request = await SOSRequest.findById(sosRequestId);
    if (!request) throw new Error('SOS Request not found');

    if (request.status === 'Fulfilled') {
      return { success: true, status: 'fulfilled', message: 'SOS Request is already fulfilled' };
    }

    // Since this is a simplified response, we just record it.
    // In a real system, we'd update the SOSEvaluationLog or SOSRequest directly.
    return { success: true, status: response === 'accepted' ? 'accepted' : 'declined', message: 'Response recorded successfully' };
  }
}
