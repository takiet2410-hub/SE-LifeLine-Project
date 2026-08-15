import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sosApi, type SOSRequest } from '../services/sosApi';
import { SOSStatusBadge } from '../components/SOSStatusBadge';
import { SOSTimeline } from '../components/SOSTimeline';
import { HospitalMapModal } from '../components/HospitalMapModal';
import { ArrowLeft, User, Calendar, Hospital, Activity, AlertCircle, MapPin, Phone, CheckCircle, Package, UserCheck, Truck, Clock, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { FulfillSOSModal } from '../components/FulfillSOSModal';
import { RecordDirectDonationModal } from '../components/RecordDirectDonationModal';

export const SOSRequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<SOSRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [evaluationLog, setEvaluationLog] = useState<any>(null);
  const [isFulfillModalOpen, setIsFulfillModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [confirmingShipmentId, setConfirmingShipmentId] = useState<string | null>(null);

  const authUser = JSON.parse(localStorage.getItem('user') || '{}');
  const canFulfill = authUser.role === 'BloodCenterStaff';
  const isHospitalStaff = authUser.role === 'HospitalStaff';

  useEffect(() => {
    let intervalId: any = null;

    const fetchRequest = async (isSilent = false) => {
      if (!id) return;
      try {
        if (!isSilent) setIsLoading(true);
        const [requestData, logData] = await Promise.all([
          sosApi.getSOSRequestById(id),
          sosApi.getEvaluationLog(id).catch(() => null),
        ]);
        setRequest(requestData);
        if (logData) setEvaluationLog(logData);

        // Auto poll if evaluation is in progress or pending
        if (['Pending', 'EvaluationInProgress'].includes(requestData?.status)) {
          if (!intervalId) {
            intervalId = setInterval(() => {
              fetchRequest(true);
            }, 3000);
          }
        } else if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      } catch (error: any) {
        console.error('Failed to fetch SOS request:', error);
        if (!isSilent) {
          toast.error('Failed to load request details');
          navigate(isHospitalStaff ? '/hospital/sos-requests' : '/bc/sos-requests');
        }
      } finally {
        if (!isSilent) setIsLoading(false);
      }
    };

    fetchRequest();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [id, navigate, isHospitalStaff]);

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
          onClick={() => navigate(isHospitalStaff ? '/hospital/sos-requests' : '/bc/sos-requests')}
          className="mt-4 bg-brand-primary hover:bg-brand-primary-hover text-white px-4 py-2 rounded-lg"
        >
          Quay lại danh sách SOS
        </button>
      </div>
    );
  }


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
            onClick={() => navigate(isHospitalStaff ? '/hospital/sos-requests' : '/bc/sos-requests')}
            className="p-2 hover:bg-brand-bg-muted rounded-full transition-colors text-brand-text-secondary cursor-pointer"
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
        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Hospital Staff: Direct Donation Record Button */}
          {isHospitalStaff && !['Cancelled', 'Expired', 'Fulfilled'].includes(request.status) && (
            <button
              onClick={() => setIsRecordModalOpen(true)}
              className="bg-red-600 hover:bg-red-700 active:scale-98 text-white px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              + Tiếp nhận hiến máu trực tiếp
            </button>
          )}

          {/* Only show Cancel button when request is still pending evaluation */}
          {(request.status === 'Pending' || request.status === 'EvaluationInProgress') && (
            <button
              onClick={handleCancelRequest}
              className="bg-brand-error/10 text-brand-error hover:bg-brand-error/20 px-4 py-2 rounded-xl font-medium transition-colors"
            >
              Huỷ yêu cầu
            </button>
          )}

          {/* Blood Center Staff: Fulfill from inventory */}
          {canFulfill && (request.status === 'Pending' || request.status === 'EvaluationInProgress' || request.status === 'NotificationsDispatched' || request.status === 'InventoryDispatched') && (
            <button
              onClick={() => setIsFulfillModalOpen(true)}
              className="bg-brand-primary text-white hover:bg-brand-primary/90 px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              <Package className="w-4 h-4" />
              Xuất kho gửi máu
            </button>
          )}
        </div>
      </div>

      {(() => {
        const currentReceived = request.receivedQuantityMl ?? (
          (request.shipments || []).filter((s: any) => s.status === 'Received').reduce((acc: number, s: any) => acc + (s.volumeMl || 0), 0) +
          (request.directDonations || []).reduce((acc: number, d: any) => acc + (d.volumeMl || 0), 0)
        );
        const currentInTransit = request.inTransitQuantityMl || (request.shipments || []).filter((s: any) => s.status === 'InTransit').reduce((acc: number, s: any) => acc + (s.volumeMl || 0), 0);
        const targetVolume = request.requiredQuantityMl || 1;
        const receivedPercent = Math.min(100, Math.round((currentReceived / targetVolume) * 100));
        const inTransitPercent = Math.min(100 - receivedPercent, Math.round((currentInTransit / targetVolume) * 100));
        const remainingNeeded = Math.max(0, targetVolume - currentReceived);
        const committedDonorsCount = request.acceptedDonorIds?.length || 0;

        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-6">

              {/* Blood & Progress */}
              <div className="bg-brand-bg-card rounded-xl border border-brand-border shadow-sm p-6">
                <h2 className="text-lg font-bold text-brand-text-main flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-brand-primary" />
                  Tiến Độ Tiếp Nhận Máu Cấp Cứu
                </h2>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-extrabold text-xl shadow-xs">
                      {request.bloodType}
                    </div>
                    <div>
                      <p className="text-xs text-brand-text-muted">Tổng nhu cầu mục tiêu</p>
                      <p className="text-lg font-extrabold text-brand-text-main">{request.requiredQuantityMl} ml</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-brand-text-muted mb-1">Trạng thái</p>
                    <SOSStatusBadge status={request.status} />
                  </div>
                </div>

                {/* Multi-segment Progress Bar */}
                <div className="w-full bg-gray-100 rounded-full h-3.5 mb-2 overflow-hidden flex shadow-inner">
                  <div
                    className="bg-emerald-600 h-3.5 transition-all duration-700"
                    style={{ width: `${receivedPercent}%` }}
                    title={`Đã nhận chính thức: ${currentReceived}ml (${receivedPercent}%)`}
                  />
                  <div
                    className="bg-amber-400 h-3.5 transition-all duration-700"
                    style={{ width: `${inTransitPercent}%` }}
                    title={`Đang vận chuyển: ${currentInTransit}ml (${inTransitPercent}%)`}
                  />
                </div>

                {/* Progress Legend & Stats */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <span className="flex items-center gap-1.5 font-semibold text-emerald-800">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                      Đã nhận: {currentReceived} ml ({receivedPercent}%)
                    </span>
                    {currentInTransit > 0 && (
                      <span className="flex items-center gap-1.5 font-semibold text-amber-800">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        Đang chuyển tới: {currentInTransit} ml ({inTransitPercent}%)
                      </span>
                    )}
                    {committedDonorsCount > 0 && (
                      <span className="flex items-center gap-1.5 font-semibold text-blue-700" title="Tình nguyện viên đã bấm đồng ý đến hiến máu">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        {committedDonorsCount} tình nguyện viên đã xác nhận đến
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-red-600">
                    {remainingNeeded > 0 ? `Còn thiếu: ${remainingNeeded} ml` : '✅ Đã đủ lượng máu!'}
                  </span>
                </div>
              </div>

              {/* Shipments from Blood Centers Card */}
              {request.shipments && request.shipments.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
                  <h3 className="text-base font-bold text-gray-900 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Truck className="w-5 h-5 text-amber-600" />
                      Đợt Máu Điều Phối Từ Trung Tâm Máu ({request.shipments.length})
                    </span>
                  </h3>

                  <div className="divide-y divide-gray-100">
                    {request.shipments.map((s, idx) => (
                      <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-gray-900">{s.bloodCenterName || 'Trung tâm máu'}</span>
                            <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                              {s.shipmentCode}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            Thể tích: <strong className="text-gray-900">{s.volumeMl} ml</strong> ({s.bloodType}) • Xuất lúc: {formatDate(s.dispatchedAt)}
                          </div>
                        </div>

                        <div>
                          {s.status === 'InTransit' ? (
                            isHospitalStaff ? (
                              <button
                                type="button"
                                disabled={confirmingShipmentId === (s._id || s.id)}
                                onClick={async () => {
                                  if (!confirm(`Xác nhận bệnh viện đã nhận được ${s.volumeMl}ml máu từ ${s.bloodCenterName}?`)) return;
                                  try {
                                    setConfirmingShipmentId(s._id || s.id || null);
                                    await sosApi.confirmShipmentReceived(request.id || (request as any)._id, (s._id || s.id)!);
                                    toast.success(`Đã xác nhận nhận đợt máu ${s.shipmentCode} thành công!`);
                                    const refreshed = await sosApi.getSOSRequestById(request.id || (request as any)._id);
                                    setRequest(refreshed);
                                  } catch (err: any) {
                                    toast.error(err.response?.data?.message || 'Không thể xác nhận nhận đợt máu');
                                  } finally {
                                    setConfirmingShipmentId(null);
                                  }
                                }}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-98 cursor-pointer disabled:opacity-50"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                {confirmingShipmentId === (s._id || s.id) ? 'Đang xác nhận...' : 'Xác nhận đã nhận đợt này'}
                              </button>
                            ) : (
                              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                                <Truck className="w-3.5 h-3.5 animate-pulse" />
                                Đang vận chuyển
                              </span>
                            )
                          ) : (
                            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Bệnh viện đã nhận
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Direct Donations at Hospital Card */}
              {request.directDonations && request.directDonations.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-red-600" />
                    Hiến Máu Tiếp Nhận Trực Tiếp Tại Bệnh Viện ({request.directDonations.length})
                  </h3>

                  <div className="divide-y divide-gray-100">
                    {request.directDonations.map((d, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">{d.donorName}</span>
                            {d.fastTrackCode && (
                              <span className="font-mono text-[10px] bg-red-100 text-red-800 px-1.5 py-0.2 rounded font-bold">
                                {d.fastTrackCode}
                              </span>
                            )}
                          </div>
                          <div className="text-gray-500 mt-0.5">
                            CCCD: {d.idDocumentNumber || 'N/A'} • Tiếp nhận lúc: {formatDate(d.recordedAt)}
                            {d.note && <span className="italic ml-1">({d.note})</span>}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-extrabold text-emerald-700">+{d.volumeMl} ml</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                {(() => {
                  const hospitalData: any = request.hospital || request.hospitalId;
                  return (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-brand-text-muted">Hospital Name</p>
                        <p className="font-medium text-brand-text-main">{hospitalData?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-brand-text-muted">Address</p>
                        <p className="font-medium text-brand-text-main">{hospitalData?.address || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-brand-text-muted">Contact</p>
                        <p className="font-medium text-brand-text-main">{hospitalData?.contactPhone || 'Blood Transfusion Dept.'}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Action Buttons */}
              <div className="bg-brand-bg-card rounded-xl border border-brand-border shadow-sm p-6">
                <h2 className="text-lg font-bold text-brand-text-main flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-brand-primary" />
                  Quick Actions
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setIsMapOpen(true)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 rounded-lg border border-brand-primary/20 transition-colors"
                  >
                    <MapPin className="w-5 h-5" />
                    Get Directions
                  </button>
                  <a
                    href={`tel:${(request.hospital || request.hospitalId as any)?.contactPhone || ''}`}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 rounded-lg border border-brand-primary/20 transition-colors"
                  >
                    <Phone className="w-5 h-5" />
                    <span className="flex flex-col items-center">
                      <span>Call Hospital</span>
                      {(request.hospital || request.hospitalId as any)?.contactPhone && (
                        <span className="text-xs font-semibold">{(request.hospital || request.hospitalId as any).contactPhone}</span>
                      )}
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        );
      })()}


      {/* Map Modal */}
      {(() => {
        const hospitalData: any = request.hospital || request.hospitalId;
        if (!hospitalData || !hospitalData.location) return null;
        return (
          <HospitalMapModal
            isOpen={isMapOpen}
            onClose={() => setIsMapOpen(false)}
            hospitalName={hospitalData.name}
            hospitalAddress={hospitalData.address}
            coordinates={hospitalData.location.coordinates}
          />
        );
      })()}

      {request && (
        <FulfillSOSModal
          isOpen={isFulfillModalOpen}
          onClose={() => setIsFulfillModalOpen(false)}
          request={request}
          onSuccess={async () => {
            setIsFulfillModalOpen(false);
            const refreshed = await sosApi.getSOSRequestById(request.id || (request as any)._id);
            setRequest(refreshed);
          }}
        />
      )}

      {request && (
        <RecordDirectDonationModal
          isOpen={isRecordModalOpen}
          onClose={() => setIsRecordModalOpen(false)}
          request={request}
          onSuccess={async () => {
            setIsRecordModalOpen(false);
            const refreshed = await sosApi.getSOSRequestById(request.id || (request as any)._id);
            setRequest(refreshed);
          }}
        />
      )}
    </div>
  );
};