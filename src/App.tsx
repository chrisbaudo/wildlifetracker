import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';

import { AppLayout } from '@/components/AppLayout';
import { useAuth } from '@/hooks/AuthContext';

const AuthPage = lazy(() =>
  import('@/components/AuthPage').then((module) => ({ default: module.AuthPage }))
);
const AnimalDetailPage = lazy(() =>
  import('@/pages/AnimalDetailPage').then((module) => ({ default: module.AnimalDetailPage }))
);
const AnimalsPage = lazy(() =>
  import('@/pages/AnimalsPage').then((module) => ({ default: module.AnimalsPage }))
);
const CapturesPage = lazy(() =>
  import('@/pages/CapturesPage').then((module) => ({ default: module.CapturesPage }))
);
const CollarDeploymentsPage = lazy(() =>
  import('@/pages/CollarDeploymentsPage').then((module) => ({ default: module.CollarDeploymentsPage }))
);
const CollarModelsPage = lazy(() =>
  import('@/pages/CollarModelsPage').then((module) => ({ default: module.CollarModelsPage }))
);
const HomePage = lazy(() =>
  import('@/pages/HomePage').then((module) => ({ default: module.HomePage }))
);
const PersonnelPage = lazy(() =>
  import('@/pages/PersonnelPage').then((module) => ({ default: module.PersonnelPage }))
);
const RealtimeDashboardPage = lazy(() =>
  import('@/pages/RealtimeDashboardPage').then((module) => ({ default: module.RealtimeDashboardPage }))
);
const SpeciesPage = lazy(() =>
  import('@/pages/SpeciesPage').then((module) => ({ default: module.SpeciesPage }))
);
const StudyAreasPage = lazy(() =>
  import('@/pages/StudyAreasPage').then((module) => ({ default: module.StudyAreasPage }))
);
const TelemetryFixesPage = lazy(() =>
  import('@/pages/TelemetryFixesPage').then((module) => ({ default: module.TelemetryFixesPage }))
);

function RouteLoading() {
  return (
    <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
      Loading...
    </div>
  );
}

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
      <Suspense fallback={<RouteLoading />}>
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
              <Route path="/animals/:id" element={<AnimalDetailPage />} />
              <Route path="/collar-deployments" element={<CollarDeploymentsPage />} />
              <Route path="/captures" element={<CapturesPage />} />
              <Route path="/telemetry" element={<TelemetryFixesPage />} />
              <Route path="/realtime-dashboard" element={<RealtimeDashboardPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Toaster richColors closeButton />
    </BrowserRouter>
  );
}

export default App;
