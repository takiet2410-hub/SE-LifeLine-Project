import React, { useState, useEffect } from 'react';
import { AppointmentTabs } from '../components/AppointmentTabs';
import { AppointmentListItem } from '../components/AppointmentListItem';
import { AppointmentDetails } from '../components/AppointmentDetails';
import { CancelAppointmentModal } from '../components/CancelAppointmentModal';
import { DownloadToast } from '../components/DownloadToast';
import { fetchAppointments, cancelAppointment, downloadETicket } from '../api/bookingApi';
import type { Appointment, AppointmentStatus } from '../types';
import { CalendarX2, Loader2, FileText, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MyAppointmentPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AppointmentStatus>('all');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal & Toast States
  const [cancelModalData, setCancelModalData] = useState<{ isOpen: boolean; appointmentId: string | null; isProcessing: boolean; error: string | null }>({
    isOpen: false,
    appointmentId: null,
    isProcessing: false,
    error: null
  });
  
  const [toastData, setToastData] = useState<{ isVisible: boolean; message: string }>({
    isVisible: false,
    message: ''
  });

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchAppointments();
      if (res.success && res.data) {
        setAppointments(res.data);
        // Default select first item if upcoming
        const upcomings = res.data.filter(a => a.status === 'upcoming');
        if (upcomings.length > 0) {
          setSelectedId(upcomings[0].id);
        } else if (res.data.length > 0) {
          setSelectedId(res.data[0].id);
        }
      } else {
        setError(res.message || 'Failed to load appointments');
      }
    } catch (err) {
      setError('System error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAppointments = activeTab === 'all' 
    ? appointments 
    : appointments.filter(apt => apt.status === activeTab);
  const selectedAppointment = appointments.find(apt => apt.id === selectedId);

  // When tab changes, try to auto-select the first item in the new tab
  useEffect(() => {
    if (filteredAppointments.length > 0) {
      if (!filteredAppointments.some(a => a.id === selectedId)) {
        setSelectedId(filteredAppointments[0].id);
      }
    } else {
      setSelectedId(null);
    }
  }, [activeTab, filteredAppointments, selectedId]);

  // Cancel Flow
  const handleOpenCancelModal = (id: string) => {
    setCancelModalData({ isOpen: true, appointmentId: id, isProcessing: false, error: null });
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalData.appointmentId) return;

    setCancelModalData(prev => ({ ...prev, isProcessing: true, error: null }));
    
    try {
      const res = await cancelAppointment(cancelModalData.appointmentId);
      if (res.success) {
        setAppointments(prev => prev.map(apt => 
          apt.id === cancelModalData.appointmentId 
            ? { ...apt, status: 'cancelled' } 
            : apt
        ));
        setCancelModalData({ isOpen: false, appointmentId: null, isProcessing: false, error: null });
        setToastData({ isVisible: true, message: 'Appointment cancelled successfully' });
      } else {
        setCancelModalData(prev => ({ ...prev, isProcessing: false, error: res.message || 'Cancellation failed' }));
      }
    } catch (err) {
      setCancelModalData(prev => ({ ...prev, isProcessing: false, error: 'Network error' }));
    }
  };

  // Download Flow
  const handleDownload = async (id: string) => {
    try {
      const res = await downloadETicket(id);
      if (res.success) {
        setToastData({ isVisible: true, message: 'E-Ticket downloaded successfully' });
      } else {
        alert(res.message); 
      }
    } catch (err) {
      alert('Network error');
    }
  };

  return (
    <div className="flex flex-col h-full relative p-6 md:p-8 max-w-[1400px] mx-auto w-full">
      <AppointmentTabs activeTab={activeTab} onChangeTab={setActiveTab} />

      {/* Main Content: Master-Detail Layout */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
        
        {/* Left Column: List View */}
        <div className="w-full md:w-[380px] shrink-0 flex flex-col overflow-y-auto pr-2 gap-3 pb-6 md:pb-0">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 text-[#93000b] animate-spin" />
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-[14px] font-medium text-[#93000b]">{error}</span>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-white border border-[#f1f3f5] rounded-xl">
              <CalendarX2 className="w-10 h-10 text-[#a3a3a3] mb-3" />
              <p className="text-[14px] font-bold text-[#271816] mb-1">No Appointments</p>
              <p className="text-[13px] text-[#6c757d]">Nothing here for {activeTab}.</p>
            </div>
          ) : (
            <>
              {filteredAppointments.map(apt => (
                <AppointmentListItem
                  key={apt.id}
                  appointment={apt}
                  isSelected={selectedId === apt.id}
                  onClick={setSelectedId}
                />
              ))}
              
              {/* Schedule Another Button Box */}
              <div className="mt-4 p-5 bg-[#fff8f7] border border-[#f1f3f5] rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
                <p className="text-[13px] font-medium text-[#5b403d] mb-3">
                  Want to donate again or at a new location?
                </p>
                <button
                  onClick={() => navigate('/my-appointments/schedule')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#93000b] hover:bg-[#7a0009] text-white text-[13px] font-semibold rounded-lg transition-all shadow-sm active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  Schedule another
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right Column: Detail View */}
        <div className="flex-1 min-w-0 bg-transparent flex flex-col pb-6 md:pb-0">
          {!isLoading && selectedAppointment ? (
            <AppointmentDetails 
              appointment={selectedAppointment}
              onCancel={handleOpenCancelModal}
              onDownload={handleDownload}
              isCancelling={cancelModalData.appointmentId === selectedAppointment.id && cancelModalData.isProcessing}
            />
          ) : (
            <div className="h-full border border-dashed border-[#dee2e6] rounded-xl flex flex-col items-center justify-center bg-white/50 text-[#a3a3a3]">
              <FileText className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-[14px] font-medium">Select an appointment to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Overlays */}
      <CancelAppointmentModal
        isOpen={cancelModalData.isOpen}
        onClose={() => setCancelModalData(prev => ({ ...prev, isOpen: false, error: null }))}
        onConfirm={handleConfirmCancel}
        isProcessing={cancelModalData.isProcessing}
        error={cancelModalData.error}
      />

      <DownloadToast
        isVisible={toastData.isVisible}
        message={toastData.message}
        onClose={() => setToastData(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
};
