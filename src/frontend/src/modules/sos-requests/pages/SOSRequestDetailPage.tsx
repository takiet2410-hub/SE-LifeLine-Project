import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sosApi, type SOSRequest } from '../services/sosApi';
import { SOSStatusBadge } from '../components/SOSStatusBadge';
import { SOSTimeline } from '../components/SOSTimeline';
import { ArrowLeft, User, Calendar, Hospital, Activity, AlertCircle, MapPin, Phone, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const SOSRequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<SOSRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [evaluationLog, setEvaluationLog] = useState<any>(null);

  useEffect(() => {
    const fetchRequest = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const [requestData, logData] = await Promise.all([
          sosApi.getSOSRequestById(id),
          sosApi.getEvaluationLog(id),
        ]);
        setRequest(requestData);
        setEvaluationLog(logData);
      } catch (error: any) {
        console.error('Failed to fetch SOS request:', error);
        toast.error('Failed to load request details');
        navigate('/hospital/sos-requests');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequest();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
        <p className="text-brand-text-muted">Loading request details...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="w-12 h-12 text-brand-error" />
        <p className="text-brand-text-muted">SOS request not found</p>
        <button 
          onClick={() => navigate('/hospital/sos-requests')}
          className="mt-4 bg-brand-primary hover:bg-brand-primary-hover text-white px-4 py-2 rounded-lg"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const fulfillmentPercentage = evaluationLog 
    ? Math.min(100, Math.round((evaluationLog.rankedBloodCenters?.length || 0) / 10 * 100))
    : 0;

  const handleCancelRequest = async () => {
    if (!confirm('Are you sure you want to cancel this SOS request?')) return;
    
    try {
      await sosApi.updateSOSRequestStatus(id!, { status: 'Cancelled' });
      setRequest(prev => prev ? { ...prev, status: 'Cancelled' } : null);
      toast.success('SOS Request cancelled successfully');
    } catch (error) {
      console.error('Failed to cancel request:', error);
      toast.error('Failed to cancel request');
    }
  };

  const formatDate = (dateStr: string) => format(new Date(dateStr), 'MMMM dd, yyyy - HH:mm');

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/hospital/sos-requests')}
            className="p-2 hover:bg-brand-bg-muted rounded-full transition-colors text-brand-text-secondary"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-brand-text-main">{request.id || (request as any)._id}</h1>
              <SOSStatusBadge status={request.status} />
              <SOSStatusBadge urgency={request.urgencyLevel} />
            </div>
            <p className="text-brand-text-secondary mt-1 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Requested on {formatDate(request.createdAt)}
            </p>
          </div>
        </div>
        {(request.status === 'Pending' || request.status === 'EvaluationInProgress') && (
          <button 
            onClick={handleCancelRequest}
            className="bg-brand-error/10 text-brand-error hover:bg-brand-error/20 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Cancel Request
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Blood & Progress */}
          <div className="bg-brand-bg-card rounded-xl border border-brand-border shadow-sm p-6">
            <h2 className="text-lg font-bold text-brand-text-main flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-brand-primary" />
              Fulfillment Progress
            </h2>
            
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-xl">
                  {request.bloodType}
                </div>
                <div>
                  <p className="text-sm text-brand-text-muted">Target Quantity</p>
                  <p className="font-semibold text-brand-text-main">{request.requiredQuantityMl} ml</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-brand-text-muted">Status</p>
                <SOSStatusBadge status={request.status} />
              </div>
            </div>
            
            <div className="w-full bg-brand-bg-muted rounded-full h-3 mb-2 overflow-hidden">
              <div 
                className="bg-brand-primary h-3 rounded-full transition-all duration-1000" 
                style={{ width: `${request.status === 'Fulfilled' ? 100 : request.status === 'NotificationsDispatched' ? 50 : 25}%` }}
              ></div>
            </div>
            <p className="text-right text-xs font-medium text-brand-text-muted">
              {request.status === 'Fulfilled' ? '100% Complete' : 
               request.status === 'NotificationsDispatched' ? '50% - Notifications Dispatched' : 
               '25% - Evaluation In Progress'}
            </p>
          </div>

          {/* Timeline */}
          <div className="bg-brand-bg-card rounded-xl border border-brand-border shadow-sm p-6">
            <h2 className="text-lg font-bold text-brand-text-main mb-4">Request Timeline</h2>
            <SOSTimeline currentStatus={request.status} />
          </div>

          {/* Evaluation Details */}
          {evaluationLog && (
            <div className="bg-brand-bg-card rounded-xl border border-brand-border shadow-sm p-6">
              <h2 className="text-lg font-bold text-brand-text-main flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 text-brand-primary" />
                Evaluation Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-brand-text-main mb-3">Blood Centers Identified</h3>
                  {evaluationLog.rankedBloodCenters?.length > 0 ? (
                    <div className="space-y-2">
                      {evaluationLog.rankedBloodCenters.slice(0, 5).map((center: any, idx: number) => (
                        <div key={idx} className="p-3 bg-brand-bg-muted rounded-lg border border-brand-border">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-brand-text-main">Center #{idx + 1}</span>
                            <span className="text-sm text-brand-text-secondary">{center.distanceKm?.toFixed(1)} km</span>
                          </div>
                          <div className="flex justify-between text-sm text-brand-text-muted mt-1">
                            <span>Inventory: {center.inventoryVolume} ml</span>
                            <span>Score: {center.score?.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-brand-text-muted">No blood centers with matching inventory found</p>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-brand-text-main mb-3">Donors Notified</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-brand-info/10 text-brand-info rounded text-sm">
                      {evaluationLog.rankedDonors?.length || 0} donors
                    </span>
                    <span className="px-2 py-1 bg-brand-warning/10 text-brand-warning rounded text-sm">
                      Radius: {evaluationLog.searchRadiusKmUsed} km
                    </span>
                    <span className="px-2 py-1 bg-brand-info/10 text-brand-info rounded text-sm">
                      Expansions: {evaluationLog.radiusExpansionCount}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-brand-text-secondary">Blood Centers Notified: <span className="font-medium text-brand-text-main">{evaluationLog.notificationDeliveryStats?.bloodCentersNotified || 0}</span></div>
                    <div className="text-sm text-brand-text-secondary">Donors Notified: <span className="font-medium text-brand-text-main">{evaluationLog.notificationDeliveryStats?.donorsNotified || 0}</span></div>
                    <div className="text-sm text-brand-text-secondary">Timestamp: <span className="font-medium text-brand-text-main">{evaluationLog.notificationDeliveryStats?.timestamp ? formatDate(evaluationLog.notificationDeliveryStats.timestamp) : 'N/A'}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Info */}
        <div className="space-y-6">
          <div className="bg-brand-bg-card rounded-xl border border-brand-border shadow-sm p-6">
            <h2 className="text-lg font-bold text-brand-text-main flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-brand-primary" />
              Patient Information
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-brand-text-muted">Reference</p>
                <p className="font-medium text-brand-text-main">{request.patientReference || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-brand-text-muted">Urgency Level</p>
                <SOSStatusBadge urgency={request.urgencyLevel} />
              </div>
              <div>
                <p className="text-sm text-brand-text-muted">Required Quantity</p>
                <p className="font-medium text-brand-text-main">{request.requiredQuantityMl} ml</p>
              </div>
              <div>
                <p className="text-sm text-brand-text-muted">Fulfillment Deadline</p>
                <p className="font-medium text-brand-text-main">{formatDate(request.fulfillmentDeadline)}</p>
              </div>
            </div>
          </div>

          <div className="bg-brand-bg-card rounded-xl border border-brand-border shadow-sm p-6">
            <h2 className="text-lg font-bold text-brand-text-main flex items-center gap-2 mb-4">
              <Hospital className="w-5 h-5 text-brand-primary" />
              Hospital Details
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-brand-text-muted">Hospital Name</p>
                <p className="font-medium text-brand-text-main">{request.hospital?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-brand-text-muted">Address</p>
                <p className="font-medium text-brand-text-main">{request.hospital?.address || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-brand-text-muted">Contact</p>
                <p className="font-medium text-brand-text-main">{((request.hospital as unknown) as any)?.contactPhone || 'Blood Transfusion Dept.'}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-brand-bg-card rounded-xl border border-brand-border shadow-sm p-6">
            <h2 className="text-lg font-bold text-brand-text-main flex items-center gap-2 mb-4">
              <Truck className="w-5 h-5 text-brand-primary" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 px-4 py-3 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 rounded-lg border border-brand-primary/20 transition-colors">
                <MapPin className="w-5 h-5" />
                Get Directions
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-3 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 rounded-lg border border-brand-primary/20 transition-colors">
                <Phone className="w-5 h-5" />
                Call Hospital
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};