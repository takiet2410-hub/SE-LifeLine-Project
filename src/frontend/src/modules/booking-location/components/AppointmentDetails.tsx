import React from 'react';
import { CalendarDays, Clock, MapPin, Download, XCircle, Droplet, Activity, Heart, Scale, RefreshCw } from 'lucide-react';
import type { Appointment } from '../types';

interface AppointmentDetailsProps {
  appointment: Appointment;
  onCancel: (id: string) => void;
  onDownload: (id: string) => void;
  onSync?: (id: string) => void;
  isCancelling?: boolean;
  isSyncing?: boolean;
}

export const AppointmentDetails: React.FC<AppointmentDetailsProps> = ({
  appointment,
  onCancel,
  onDownload,
  onSync,
  isCancelling = false,
  isSyncing = false
}) => {
  const isUpcoming = appointment.status === 'upcoming';
  const isCancelled = appointment.status === 'cancelled';
  const isCompleted = appointment.status === 'completed';

  return (
    <div className="bg-white border border-[#f1f3f5] rounded-xl overflow-hidden shadow-sm h-full flex flex-col">
      {/* Header Image Gradient */}
      <div className="h-24 md:h-32 bg-gradient-to-r from-[#93000b] to-[#c70014] relative shrink-0">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
      </div>

      <div className="p-6 md:p-8 flex-1 flex flex-col overflow-y-auto">
        {/* Status & Blood Type Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-[20px] font-bold text-[#271816] mb-1">
              Donation Details
            </h2>
            <div className="flex items-center gap-2">
              {isUpcoming && (
                <span className="px-3 py-1 rounded-full text-[12px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  UPCOMING
                </span>
              )}
              {isCompleted && (
                <span className="px-3 py-1 rounded-full text-[12px] font-bold bg-green-50 text-green-700 border border-green-200">
                  COMPLETED
                </span>
              )}
              {isCancelled && (
                <span className="px-3 py-1 rounded-full text-[12px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                  CANCELLED
                </span>
              )}

              {appointment.bloodType && (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-bold bg-[#fff8f7] text-[#93000b] border border-[#93000b]/20">
                  <Droplet className="w-3 h-3 fill-current" />
                  {appointment.bloodType}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Detail Grid: Location & Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-4 bg-[#f8f9fa] rounded-xl border border-[#f1f3f5]">
            <div className="flex items-center gap-2 text-[#93000b] mb-2">
              <CalendarDays className="w-5 h-5" />
              <span className="font-bold text-[14px]">Date & Time</span>
            </div>
            <p className="text-[15px] font-semibold text-[#271816]">{appointment.date}</p>
            <p className="text-[13px] text-[#6c757d] flex items-center gap-1.5 mt-1">
              <Clock className="w-3.5 h-3.5" />
              {appointment.time}
            </p>
          </div>

          <div className="p-4 bg-[#f8f9fa] rounded-xl border border-[#f1f3f5]">
            <div className="flex items-center gap-2 text-[#93000b] mb-2">
              <MapPin className="w-5 h-5" />
              <span className="font-bold text-[14px]">Location</span>
            </div>
            <p className="text-[15px] font-semibold text-[#271816]">{appointment.location.name}</p>
            <p className="text-[13px] text-[#6c757d] mt-1 leading-snug">
              {appointment.location.address || 'Address will be provided by the blood center.'}
            </p>
          </div>
        </div>

        {/* Health Screening Summary (If applicable) */}
        {appointment.healthSummary && Object.keys(appointment.healthSummary).length > 0 && (
          <div className="mb-8 border-t border-[#f1f3f5] pt-6">
            <h3 className="text-[16px] font-bold text-[#271816] mb-4">Health Screening Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {appointment.healthSummary.bloodPressure && (
                <div className="flex flex-col gap-1">
                  <span className="text-[12px] text-[#6c757d] flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5" /> BP
                  </span>
                  <span className="font-semibold text-[14px] text-[#271816]">{appointment.healthSummary.bloodPressure}</span>
                </div>
              )}
              {appointment.healthSummary.heartRate && (
                <div className="flex flex-col gap-1">
                  <span className="text-[12px] text-[#6c757d] flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5" /> Heart Rate
                  </span>
                  <span className="font-semibold text-[14px] text-[#271816]">{appointment.healthSummary.heartRate}</span>
                </div>
              )}
              {appointment.healthSummary.weight && (
                <div className="flex flex-col gap-1">
                  <span className="text-[12px] text-[#6c757d] flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5" /> Weight
                  </span>
                  <span className="font-semibold text-[14px] text-[#271816]">{appointment.healthSummary.weight}</span>
                </div>
              )}
              {appointment.healthSummary.hemoglobin && (
                <div className="flex flex-col gap-1">
                  <span className="text-[12px] text-[#6c757d] flex items-center gap-1">
                    <Droplet className="w-3.5 h-3.5" /> Hemoglobin
                  </span>
                  <span className="font-semibold text-[14px] text-[#271816]">{appointment.healthSummary.hemoglobin}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* QR Code & Actions Section */}
        <div className="mt-auto border-t border-[#f1f3f5] pt-6 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          {/* QR Code */}
          {(isUpcoming || isCompleted) && (
            <div className="flex items-center gap-4 bg-[#f8f9fa] p-3 rounded-xl border border-[#dee2e6]">
              <div className="w-20 h-20 bg-white border border-[#dee2e6] rounded-lg flex items-center justify-center">
                {/* Mock QR Code Image */}
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=LifeLineAppt" alt="QR Code" className="w-16 h-16 opacity-80" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-[#93000b] mb-1">E-TICKET READY</p>
                <p className="text-[11px] text-[#6c757d] max-w-[120px]">Scan at the reception counter.</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 w-full sm:w-auto">
            {isUpcoming && (
              <>
                <button
                  onClick={() => onDownload(appointment.id)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[#93000b] hover:bg-[#7a0009] text-white text-[14px] font-semibold rounded-lg transition-all shadow-sm active:scale-[0.98]"
                >
                  <Download className="w-4 h-4" />
                  Download E-Ticket
                </button>
                {onSync && (
                  <button
                    onClick={() => onSync(appointment.id)}
                    disabled={isSyncing}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[#455F87] hover:bg-[#344866] text-white text-[14px] font-semibold rounded-lg transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Đang gửi...' : 'Gửi hồ sơ sang BV'}
                  </button>
                )}
                <button
                  onClick={() => onCancel(appointment.id)}
                  disabled={isCancelling}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 border border-[#dee2e6] text-[#271816] hover:bg-red-50 hover:text-[#93000b] hover:border-[#93000b]/30 text-[14px] font-semibold rounded-lg transition-all disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel Appointment
                </button>
              </>
            )}
            
            {isCompleted && (
              <button
                onClick={() => onDownload(appointment.id)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[#93000b] hover:bg-[#7a0009] text-white text-[14px] font-semibold rounded-lg transition-all shadow-sm active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                Download Certificate
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
