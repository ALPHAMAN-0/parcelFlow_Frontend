import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { RedirectIfAuthed, RequireAuth, RequireRole } from '@/routes/guards';
import { LandingPage } from '@/routes/pages/Landing';
import { LoginPage } from '@/routes/pages/Login';
import { RegisterPage } from '@/routes/pages/Register';
import { DashboardPage } from '@/routes/pages/Dashboard';
import { ParcelsPage } from '@/routes/pages/Parcels';
import { ParcelDetailPage } from '@/routes/pages/ParcelDetail';
import { NewParcelPage } from '@/routes/pages/NewParcel';
import { TrackPage } from '@/routes/pages/Track';
import { AdminStatsPage } from '@/routes/pages/AdminStats';
import { AdminUsersPage } from '@/routes/pages/AdminUsers';
import { ForbiddenPage } from '@/routes/pages/Forbidden';
import { NotFoundPage } from '@/routes/pages/NotFound';

export function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={
          <RedirectIfAuthed>
            <LoginPage />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/register"
        element={
          <RedirectIfAuthed>
            <RegisterPage />
          </RedirectIfAuthed>
        }
      />

      {/* Signed in */}
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/parcels" element={<ParcelsPage />} />

        {/* Declared before /parcels/:trackingCode so "new" is not read as a code. */}
        <Route
          path="/parcels/new"
          element={
            <RequireRole allow={['CUSTOMER', 'ADMIN']}>
              <NewParcelPage />
            </RequireRole>
          }
        />
        <Route path="/parcels/:trackingCode" element={<ParcelDetailPage />} />

        <Route path="/track" element={<TrackPage />} />

        <Route
          path="/admin/stats"
          element={
            <RequireRole allow={['ADMIN']}>
              <AdminStatsPage />
            </RequireRole>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RequireRole allow={['ADMIN']}>
              <AdminUsersPage />
            </RequireRole>
          }
        />
        <Route path="/admin" element={<Navigate to="/admin/stats" replace />} />

        <Route path="/forbidden" element={<ForbiddenPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Unknown route while signed out */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
