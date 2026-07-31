import { FabricRealtimeDashboard } from '@/components/FabricRealtimeDashboard';

export function RealtimeDashboardPage() {
  return (
    <main className="h-[calc(100dvh-3rem)] min-h-[360px] overflow-hidden bg-background">
      <FabricRealtimeDashboard
        className="h-full"
        height="100%"
        title="Wildlife Real-Time Dashboard"
      />
    </main>
  );
}