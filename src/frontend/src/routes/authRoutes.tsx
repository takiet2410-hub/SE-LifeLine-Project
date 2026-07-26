import { Navigate, Route, Routes } from 'react-router-dom';

import {
  AuthRouteShell,
  RegisterCitizenIdPage,
  VerifyEmailPage,
  LoginPage,
  ForgotPasswordPage,
  VerifyOTPPage,
  ResetPasswordPage,
  ResetSuccessPage
} from '../modules/auth-account';

export function AuthRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth" element={<AuthRouteShell />}>
        <Route index element={<Navigate to="login" replace />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterCitizenIdPage />} />
        <Route path="verify-email" element={<VerifyEmailPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="verify-otp" element={<VerifyOTPPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="reset-success" element={<ResetSuccessPage />} />
      </Route>
    </Routes>
  );
}