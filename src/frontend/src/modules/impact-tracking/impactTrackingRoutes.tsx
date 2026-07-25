import { Route, Routes } from 'react-router-dom';
import { DashboardLayout } from '../../shared/components/layout/DashboardLayout';
import { MyProfilePage } from './pages/MyProfilePage';

export function ImpactTrackingRoutes() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="/profile" element={<MyProfilePage />} />
      </Route>
    </Routes>
  );
}
