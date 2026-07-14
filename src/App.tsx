import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';

import { AppLayout } from '@/components/AppLayout';
import { AuthPage } from '@/components/AuthPage';
import { useAuth } from '@/hooks/AuthContext';
import { AnimalsPage } from '@/pages/AnimalsPage';
import { CapturesPage } from '@/pages/CapturesPage';
import { CollarDeploymentsPage } from '@/pages/CollarDeploymentsPage';
import { CollarModelsPage } from '@/pages/CollarModelsPage';
import { HomePage } from '@/pages/HomePage';
import { PersonnelPage } from '@/pages/PersonnelPage';
import { SpeciesPage } from '@/pages/SpeciesPage';
import { StudyAreasPage } from '@/pages/StudyAreasPage';
import { TelemetryFixesPage } from '@/pages/TelemetryFixesPage';

function AuthGuard({ requireAuth }: { requireAuth: boolean }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) return <Navigate to="/auth" replace />;
  if (!requireAuth && isAuthenticated) return <Navigate to="/" replace />;

  return <Outlet />;
}

function AuthenticatedLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route element={<AuthGuard requireAuth={false} />}>
          <Route path="/auth" element={<AuthPage />} />
        </Route>

        {/* Authenticated routes with sidebar layout */}
        <Route element={<AuthGuard requireAuth={true} />}>
          <Route element={<AuthenticatedLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/collar-models" element={<CollarModelsPage />} />
            <Route path="/personnel" element={<PersonnelPage />} />
            <Route path="/species" element={<SpeciesPage />} />
            <Route path="/study-areas" element={<StudyAreasPage />} />
            <Route path="/animals" element={<AnimalsPage />} />
            <Route path="/collar-deployments" element={<CollarDeploymentsPage />} />
            <Route path="/captures" element={<CapturesPage />} />
            <Route path="/telemetry" element={<TelemetryFixesPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
