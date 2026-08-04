import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

// Auth Module
import {
  RegisterCitizenIdPage,
  VerifyEmailPage,
  LoginPage,
  ForgotPasswordPage,
  VerifyOTPPage,
  ResetPasswordPage,
  ResetSuccessPage,
} from './modules/auth-account';

// Auth & Protected Route
import { ProtectedRoute } from './shared/components/ProtectedRoute';

// Citizen / Booking & Profile
import { DashboardLayout } from './shared/components/layout/DashboardLayout';
import { MyAppointmentPage } from './modules/booking-location/pages/MyAppointmentPage';
import { InteractiveMapPage } from './modules/booking-location/pages/InteractiveMapPage';
import { ScheduleLayout } from './modules/booking-location/pages/schedule/ScheduleLayout';
import { Step1_LocationTime } from './modules/booking-location/pages/schedule/Step1_LocationTime';
import { Step2_HealthForm } from './modules/booking-location/pages/schedule/Step2_HealthForm';
import { Step3_Summary } from './modules/booking-location/pages/schedule/Step3_Summary';
import { SuccessPage } from './modules/booking-location/pages/schedule/SuccessPage';
import { ScheduleProvider } from './modules/booking-location/context/ScheduleContext';
import { MyProfilePage } from './modules/impact-tracking/pages/MyProfilePage';

// Blood Center Admin Module
import { AppLayout } from './components/common/AppLayout';
import { CampaignListPage } from './modules/campaign-mgmt/pages/CampaignListPage';
import { CreateCampaignPage } from './modules/campaign-mgmt/pages/CreateCampaignPage';
import { EditCampaignPage } from './modules/campaign-mgmt/pages/EditCampaignPage';
import { CampaignDetailPage } from './modules/campaign-mgmt/pages/CampaignDetailPage';
import { RegistrationListPage } from './modules/campaign-mgmt/pages/RegistrationListPage';
import { RegistrationDetailPage } from './modules/campaign-mgmt/pages/RegistrationDetailPage';
import { QRScanPage } from './modules/campaign-mgmt/pages/QRScanPage';

import { ArticleListPage } from './modules/content-mgmt/pages/ArticleListPage';
import { CreateArticlePage } from './modules/content-mgmt/pages/CreateArticlePage';
import { ArticleDetailPage } from './modules/content-mgmt/pages/ArticleDetailPage';

// Public News Feed Module
import { NewsFeedPage } from './modules/content-mgmt/pages/NewsFeedPage';
import { PublicArticleDetailPage } from './modules/content-mgmt/pages/PublicArticleDetailPage';

import { NotificationListPage } from './modules/notifications/pages/NotificationListPage';
import { NotificationDetailPage } from './modules/notifications/pages/NotificationDetailPage';

import { InventoryListPage } from './modules/blood-inventory/pages/InventoryListPage';
import { StockInPage } from './modules/blood-inventory/pages/StockInPage';
import { StockOutPage } from './modules/blood-inventory/pages/StockOutPage';
import { InventoryStatsPage } from './modules/blood-inventory/pages/InventoryStatsPage';
import { BloodBagDetailPage } from './modules/blood-inventory/pages/BloodBagDetailPage';

//Landing Pages
import { LandingPage } from './modules/landing-page/LandingPage';
import { AboutUsPage } from './modules/landing-page/pages/AboutUsPage';
import { HowItWorksPage } from './modules/landing-page/pages/HowItWorksPage';
import { FindLocationsPage } from './modules/landing-page/pages/FindLocationsPage';
import { HealthTipsPage } from './modules/landing-page/pages/HealthTipsPage';

// Hospital SOS Requests Module
import { SOSDashboardPage } from './modules/sos-requests/pages/SOSDashboardPage';
import { CreateSOSRequestPage } from './modules/sos-requests/pages/CreateSOSRequestPage';
import { SOSRequestDetailPage } from './modules/sos-requests/pages/SOSRequestDetailPage';
import { SOSReportsPage } from './modules/sos-requests/pages/SOSReportsPage';

// User SOS Alerts Module
import { SOSAlertsPage } from './modules/notifications/pages/SOSAlertsPage';
import { DonorNotificationPage } from './modules/notifications/pages/DonorNotificationPage';

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
      {/* 1. Public Landing Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<AboutUsPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/find-locations" element={<FindLocationsPage />} />
      <Route path="/health-tips" element={<HealthTipsPage />} />

      {/* 2. Public Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/bc/login" element={<Navigate to="/login" replace />} />
      <Route path="/bc-login" element={<Navigate to="/login" replace />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/register" element={<RegisterCitizenIdPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/verify-otp" element={<VerifyOTPPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/reset-success" element={<ResetSuccessPage />} />

      {/* Auth Sub-routes — Redirect cũ /auth/* sang top-level */}
      <Route path="/auth/*" element={<Navigate to="/login" replace />} />

      {/* 3. Citizen / Donor Portal Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={
          <ScheduleProvider>
            <DashboardLayout />
          </ScheduleProvider>
        }>
          <Route path="/dashboard" element={<Navigate to="/my-appointments" replace />} />
          <Route path="/map" element={<InteractiveMapPage />} />
          <Route path="/my-appointments" element={<MyAppointmentPage />} />
          <Route path="/profile" element={<MyProfilePage />} />
          <Route path="/notifications" element={<DonorNotificationPage />} />
          <Route path="/sos-alerts" element={<SOSAlertsPage />} />
          <Route path="/news" element={<NewsFeedPage />} />
          <Route path="/news/:articleId" element={<PublicArticleDetailPage />} />

          {/* Booking Schedule Flow */}
          <Route path="/my-appointments/schedule" element={<ScheduleLayout />}>
            <Route index element={<Navigate to="step-1" replace />} />
            <Route path="step-1" element={<Step1_LocationTime />} />
            <Route path="step-2" element={<Step2_HealthForm />} />
            <Route path="step-3" element={<Step3_Summary />} />
            <Route path="success" element={<SuccessPage />} />
          </Route>
        </Route>
      </Route>

      {/* 4. Blood Center Admin Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/bc" element={<Navigate to="/bc/campaigns" replace />} />
          <Route path="/bc/campaigns" element={<CampaignListPage />} />
          <Route path="/bc/campaigns/create" element={<CreateCampaignPage />} />
          <Route path="/bc/campaigns/:campaignId" element={<CampaignDetailPage />} />
          <Route path="/bc/campaigns/:campaignId/edit" element={<EditCampaignPage />} />
          <Route path="/bc/campaigns/:campaignId/registrations" element={<RegistrationListPage />} />
          <Route path="/bc/campaigns/:campaignId/registrations/:registrationId" element={<RegistrationDetailPage />} />
          <Route path="/bc/campaigns/:campaignId/qr-scan" element={<QRScanPage />} />

          <Route path="/bc/content" element={<ArticleListPage />} />
          <Route path="/bc/content/create" element={<CreateArticlePage />} />
          <Route path="/bc/content/:articleId" element={<ArticleDetailPage />} />

          <Route path="/bc/notifications" element={<NotificationListPage />} />
          <Route path="/bc/notifications/:notifId" element={<NotificationDetailPage />} />

          <Route path="/bc/inventory" element={<InventoryListPage />} />
          <Route path="/bc/inventory/stock-in" element={<StockInPage />} />
          <Route path="/bc/inventory/stock-out" element={<StockOutPage />} />
          <Route path="/bc/inventory/stats" element={<InventoryStatsPage />} />
          <Route path="/bc/inventory/:bagId" element={<BloodBagDetailPage />} />

          {/* Hospital Routes */}
          <Route path="/hospital" element={<Navigate to="/hospital/sos-requests" replace />} />
          <Route path="/hospital/sos-requests" element={<SOSDashboardPage />} />
          <Route path="/hospital/sos-requests/create" element={<CreateSOSRequestPage />} />
          <Route path="/hospital/sos-requests/:id" element={<SOSRequestDetailPage />} />
          <Route path="/hospital/sos-reports" element={<SOSReportsPage />} />
        </Route>
      </Route>

      {/* 5. Fallback Route */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  </>
  );
}

export default App;
