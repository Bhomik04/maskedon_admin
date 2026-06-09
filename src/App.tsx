import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getSecret, getApiUrl } from "./api";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Events from "./pages/Events";
import Photos from "./pages/Photos";
import Reports from "./pages/Reports";
import BugReports from "./pages/BugReports";
import Payments from "./pages/Payments";
import Financial from "./pages/Financial";
import Verifications from "./pages/Verifications";
import Notifications from "./pages/Notifications";

function isAuthenticated() {
  return Boolean(getSecret() && getApiUrl());
}

function RequireAuth({ children }: { children: React.ReactElement }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/users"
          element={
            <RequireAuth>
              <Users />
            </RequireAuth>
          }
        />
        <Route
          path="/events"
          element={
            <RequireAuth>
              <Events />
            </RequireAuth>
          }
        />
        <Route
          path="/photos"
          element={
            <RequireAuth>
              <Photos />
            </RequireAuth>
          }
        />
        <Route
          path="/reports"
          element={
            <RequireAuth>
              <Reports />
            </RequireAuth>
          }
        />
        <Route
          path="/bug-reports"
          element={
            <RequireAuth>
              <BugReports />
            </RequireAuth>
          }
        />
        <Route
          path="/payments"
          element={
            <RequireAuth>
              <Payments />
            </RequireAuth>
          }
        />
        <Route
          path="/financial"
          element={
            <RequireAuth>
              <Financial />
            </RequireAuth>
          }
        />
        <Route
          path="/verifications"
          element={
            <RequireAuth>
              <Verifications />
            </RequireAuth>
          }
        />
        <Route
          path="/notifications"
          element={
            <RequireAuth>
              <Notifications />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
