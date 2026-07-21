import { Route, Routes, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../../shared/components/layout/DashboardLayout';
import { MyAppointmentPage } from './pages/MyAppointmentPage';

// Schedule Flow
import { ScheduleLayout } from './pages/schedule/ScheduleLayout';
import { Step1_LocationTime } from './pages/schedule/Step1_LocationTime';
import { Step2_HealthForm } from './pages/schedule/Step2_HealthForm';
import { Step3_Summary } from './pages/schedule/Step3_Summary';
import { SuccessPage } from './pages/schedule/SuccessPage';

export function BookingRoutes() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        {/* Main Dashboard */}
        <Route path="/my-appointments" element={<MyAppointmentPage />} />
        
        {/* Schedule Flow */}
        <Route path="/my-appointments/schedule" element={<ScheduleLayout />}>
          <Route index element={<Navigate to="step-1" replace />} />
          <Route path="step-1" element={<Step1_LocationTime />} />
          <Route path="step-2" element={<Step2_HealthForm />} />
          <Route path="step-3" element={<Step3_Summary />} />
          <Route path="success" element={<SuccessPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
