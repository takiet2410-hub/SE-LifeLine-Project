import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, MapPin, Heart, HeartHandshake, ShieldAlert, Check, X, ArrowLeft, MapPin as MapPinIcon, Phone as PhoneIcon } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { type SOSUrgency } from '../../sos-requests/services/sosApi';
import { apiService } from '../../../services/apiClient';
import { HospitalMapModal } from '../../sos-requests/components/HospitalMapModal';

interface SOSAlert {
  id: string;
  sosRequestId: string;
  bloodType: string;
  urgencyLevel: SOSUrgency;
  status: string;
  hospitalName: string;
  hospitalAddress: string;
  patientReference: string;
  requiredQuantityMl: number;
  fulfillmentDeadline: string;
  createdAt: string;
  readAt: string | null;
  donorResponse?: 'accepted' | 'declined' | null;
  hospitalLocation?: {
    type: 'Point';
    coordinates: [number, number];
  };
  hospitalPhone?: string;
}

export const SOSAlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<SOSAlert | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [responseStatus, setResponseStatus] = useState<'idle' | 'accepted' | 'declined' | 'ineligible' | 'fulfilled'>('idle');
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      // Fetch SOS notifications for the donor
      const result = await apiService.getNotifications({ type: 'SOS' });
      const notifications = result.data;
      
      const sosAlerts: SOSAlert[] = (notifications || []).map((notif: any) => {
        const payload = notif.payload || notif.sosRequestInfo || {};
        return {
          id: notif._id,
          sosRequestId: notif.sourceRefId || notif.referenceId || payload.id || notif._id,
          bloodType: payload.bloodType || 'Unknown',
          urgencyLevel: payload.urgencyLevel || 'High',
          status: 'NotificationsDispatched',
          hospitalName: payload.hospitalName || 'Unknown Hospital',
          hospitalAddress: payload.hospitalAddress || 'Address not available',
          patientReference: payload.patientReference || 'N/A',
          requiredQuantityMl: payload.requiredQuantityMl || 250,
          fulfillmentDeadline: payload.fulfillmentDeadline || notif.createdAt || new Date().toISOString(),
          createdAt: notif.createdAt || new Date().toISOString(),
          readAt: notif.readAt || null,
          donorResponse: payload.donorResponse || null,
          hospitalLocation: payload.hospitalLocation,
          hospitalPhone: payload.hospitalPhone || '02838554137',
        };
      });
      
      setAlerts(sosAlerts);
    } catch (error) {
      console.error('Failed to fetch SOS alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();

    const handleUpdate = () => {
      fetchAlerts();
    };

    window.addEventListener('notifications-updated', handleUpdate);
    return () => {
      window.removeEventListener('notifications-updated', handleUpdate);
    };
  }, []);

  const handleAccept = async (alert: SOSAlert) => {
    try {
      await apiService.respondToSOS(alert.id, 'accepted');
      
      setAlerts(prev => prev.map(a => 
        a.id === alert.id ? { ...a, donorResponse: 'accepted' } : a
      ));
      setResponseStatus('accepted');
      setSelectedAlert(alert);
      setShowDetail(true);
      toast.success('Thank you! Your response has been recorded.');
    } catch (error) {
      toast.error('Failed to record response');
    }
  };

  const handleDecline = async (alert: SOSAlert) => {
    try {
      await apiService.respondToSOS(alert.id, 'declined');
      
      setAlerts(prev => prev.map(a => 
        a.id === alert.id ? { ...a, donorResponse: 'declined' } : a
      ));
      setResponseStatus('declined');
      setSelectedAlert(alert);
      setShowDetail(true);
      toast.info('Response recorded. Thank you for your time.');
    } catch (error) {
      toast.error('Failed to record response');
    }
  };

  const handleDismiss = (alert: SOSAlert) => {
    setAlerts(prev => prev.filter(a => a.id !== alert.id));
    toast.info('Alert dismissed');
  };

  const handleCardClick = async (alert: SOSAlert) => {
    // 1. Always mark as read if it's currently unread
    if (!alert.readAt) {
      try {
        await apiService.markNotificationAsRead(alert.id);
        setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, readAt: new Date().toISOString() } : a));
      } catch (err) {
        console.error('Failed to mark as read', err);
      }
    }

    // 2. If already responded, show their response detail
    if (alert.donorResponse) {
      setSelectedAlert(alert);
      setResponseStatus(alert.donorResponse);
      setShowDetail(true);
    }
    // Note: If they haven't responded yet, we don't show the detail modal
    // because that modal is specifically for AFTER responding. They can use
    // the 'I Can Help' or 'Not Now' buttons instead.
  };

  const getUrgencyColor = (urgency: SOSUrgency) => {
    switch (urgency) {
      case 'Critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  const getUrgencyIcon = (urgency: SOSUrgency) => {
    switch (urgency) {
      case 'Critical': return <ShieldAlert className="w-5 h-5" />;
      case 'High': return <AlertTriangle className="w-5 h-5" />;
      case 'Medium': return <Clock className="w-5 h-5" />;
    }
  };



  const unreadCount = alerts.filter(a => !a.readAt).length;

  // Response Detail Content
  const renderResponseDetail = () => {
    if (!selectedAlert) return null;

    switch (responseStatus) {
      case 'accepted':
        return (
          <div className="space-y-4">
            <div className="text-center py-6">
              <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <HeartHandshake className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-green-700">Thank You!</h3>
              <p className="text-gray-600 mt-2">Your willingness to help has been recorded.</p>
            </div>
            
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                <MapPinIcon className="w-5 h-5" />
                Next Steps
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-100">
                  <MapPinIcon className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-800">Go to Hospital</p>
                    <p className="text-sm text-gray-600">{selectedAlert.hospitalName}</p>
                    <p className="text-xs text-gray-500">{selectedAlert.hospitalAddress}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-100">
                  <Clock className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-800">Arrive Before</p>
                    <p className="text-sm text-gray-600">{format(new Date(selectedAlert.fulfillmentDeadline), 'MMMM dd, yyyy - HH:mm')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-100">
                  <Heart className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="font-medium text-gray-800">Bring With You</p>
                    <p className="text-sm text-gray-600">National ID Card / CCCD</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setIsMapModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                <MapPinIcon className="w-5 h-5" />
                Get Directions
              </button>
              <button 
                onClick={() => {
                  const phone = selectedAlert.hospitalPhone || '02838554137';
                  window.location.href = `tel:${phone}`;
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 border border-green-200 text-green-700 rounded-lg font-medium transition-colors"
              >
                <PhoneIcon className="w-5 h-5" />
                Call Hospital
              </button>
            </div>
          </div>
        );

      case 'declined':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <X className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700">Response Recorded</h3>
            <p className="text-gray-500 mt-2">Your response has been recorded. Thank you for your time.</p>
            <button 
              onClick={() => { setShowDetail(false); setResponseStatus('idle'); }}
              className="mt-6 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Back to Alerts
            </button>
          </div>
        );

      case 'ineligible':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="text-xl font-semibold text-yellow-700">Not Eligible to Donate</h3>
            <p className="text-yellow-600 mt-2">You need to wait 36 more days since your last donation.</p>
            <p className="text-yellow-600 mt-1"><strong>Next eligible: 12/08/2026</strong></p>
            <div className="w-full bg-yellow-50 rounded-lg p-4 mt-6 border border-yellow-200">
              <div className="h-3 bg-yellow-100 rounded-full overflow-hidden">
                <div className="bg-yellow-500 h-full rounded-full" style={{ width: '57%' }}></div>
              </div>
              <p className="text-xs text-yellow-600 mt-1 text-center">48/84 days since last donation</p>
            </div>
            <button 
              onClick={() => { setShowDetail(false); setResponseStatus('idle'); }}
              className="mt-6 px-6 py-2.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg font-medium transition-colors"
            >
              Understood
            </button>
          </div>
        );

      case 'fulfilled':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-green-700">Emergency Request Fulfilled</h3>
            <p className="text-green-600 mt-2">Thank you! This emergency blood request has collected enough blood bags from other volunteers.</p>
            <p className="text-gray-500 mt-1">Your readiness is a great motivation for the medical team.</p>
            <button 
              onClick={() => { setShowDetail(false); setResponseStatus('idle'); }}
              className="mt-6 px-6 py-2.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-medium transition-colors"
            >
              Back to Alerts
            </button>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-red-700">Critical SOS Alert</h3>
            <p className="text-red-600 mt-2">Urgent blood donation needed</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-full">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">SOS Emergency Alerts</h1>
              <p className="text-sm text-gray-500">Critical blood donation requests from hospitals</p>
            </div>
          </div>
          {unreadCount > 0 && (
            <span className="px-3 py-1 bg-red-600 text-white text-sm font-bold rounded-full">
              {unreadCount} New
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {showDetail && selectedAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Response Detail</h2>
                <button 
                  onClick={() => { setShowDetail(false); setResponseStatus('idle'); }}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {renderResponseDetail()}
            </div>
          </div>
        )}

        {selectedAlert && (
          <HospitalMapModal
            isOpen={isMapModalOpen}
            onClose={() => setIsMapModalOpen(false)}
            hospitalName={selectedAlert.hospitalName}
            hospitalAddress={selectedAlert.hospitalAddress}
            coordinates={
              selectedAlert.hospitalLocation?.coordinates 
                ? [selectedAlert.hospitalLocation.coordinates[0], selectedAlert.hospitalLocation.coordinates[1]]
                : [106.659616, 10.757826] // Default to Chợ Rẫy
            }
          />
        )}

        {/* Alerts List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Emergency Alerts</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-gray-200 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-100 animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <ShieldAlert className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-600">No SOS Alerts</h3>
              <p className="text-gray-500 mt-1">You'll receive emergency alerts here when hospitals need your blood type.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => {
                const isRead = alert.readAt !== null;
                const hasResponded = alert.donorResponse !== null;
                const isExpired = new Date(alert.fulfillmentDeadline) < new Date();

                return (
                  <div
                    key={alert.id}
                    className={`rounded-2xl p-5 border transition-all cursor-pointer ${
                      !isRead
                        ? 'bg-red-50 border-red-200 border-l-4 border-l-red-600 shadow-sm'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => handleCardClick(alert)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Urgency Badge */}
                        <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${getUrgencyColor(alert.urgencyLevel)}`}>
                          {getUrgencyIcon(alert.urgencyLevel)}
                          {alert.urgencyLevel}
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`text-base font-semibold ${!isRead ? 'text-red-700' : 'text-gray-900'}`}>
                              Critical SOS Alert
                            </h3>
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700">
                              🚨 SOS EMERGENCY
                            </span>
                          </div>

                          <p className="text-gray-600 leading-relaxed">
                            <strong>{alert.bloodType}</strong> blood needed urgently at <strong>{alert.hospitalName}</strong>.
                            Patient: {alert.patientReference}. Required: {alert.requiredQuantityMl} ml.
                          </p>

                          <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {alert.hospitalAddress}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              Deadline: {format(new Date(alert.fulfillmentDeadline), 'MMM dd, HH:mm')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="w-3.5 h-3.5 text-red-500" />
                              {alert.requiredQuantityMl} ml needed
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {hasResponded ? (
                          <span className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                            ✓ Responded
                          </span>
                        ) : isExpired ? (
                          <span className="px-3 py-1.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                            Expired
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleAccept(alert); }}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors"
                            >
                              I Can Help
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDecline(alert); }}
                              className="px-3 py-1.5 border border-gray-300 hover:bg-gray-50 text-gray-600 text-xs font-medium rounded-lg transition-colors"
                            >
                              Not Now
                            </button>
                            <button
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setSelectedAlert(alert);
                                setResponseStatus('ineligible');
                                setShowDetail(true);
                              }}
                              className="px-3 py-1.5 border border-yellow-300 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 text-xs font-medium rounded-lg transition-colors"
                              title="Demo: Simulate Ineligible Status"
                            >
                              [Demo] Ineligible
                            </button>
                          </>
                        )}
                        {!isRead && !hasResponded && !isExpired && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDismiss(alert); }}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Dismiss"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SOSAlertsPage;