import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/auth";
import LoginPage from "./pages/login/LoginPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import QuotationsPage from "./pages/quotations/QuotationsPage";
import ReceiptsPage from "./pages/receipts/ReceiptsPage";
import QuotationViewerWrapper from "./components/viewers/QuotationViewerWrapper";
import ReceiptViewerWrapper from "./components/viewers/ReceiptViewerWrapper";
import ReceiptEditPage from "./pages/receipts/ReceiptEditPage";
import QuotationEditPage from "./pages/quotations/QuotationEditPage";
import CreatePage from "./pages/create/CreatePage";
import AdminPage from "./pages/admin/AdminPage";
import ProfilePage from "./pages/profile/ProfilePage";
import NotificationsPage from "./pages/notifications/NotificationsPage";
import ForgotPasswordPage from "./pages/forgot-password/ForgotPasswordPage";
import ResetPasswordPage from "./pages/reset-password/ResetPasswordPage";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quotations"
            element={
              <ProtectedRoute>
                <QuotationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quotations/:id"
            element={
              <ProtectedRoute>
                <QuotationViewerWrapper />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quotations/edit/:id"
            element={
              <ProtectedRoute>
                <QuotationEditPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receipts"
            element={
              <ProtectedRoute>
                <ReceiptsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receipts/:id"
            element={
              <ProtectedRoute>
                <ReceiptViewerWrapper />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receipts/edit/:id"
            element={
              <ProtectedRoute>
                <ReceiptEditPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create"
            element={
              <ProtectedRoute>
                <CreatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
