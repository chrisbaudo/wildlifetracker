import { AppSidebar } from '@/components/AppSidebar';
import { WildlifeTrackerLogo } from '@/components/WildlifeTrackerLogo';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      <AppSidebar />
      <SidebarInset>
        <header className="relative isolate flex h-24 shrink-0 items-center overflow-hidden border-b border-[#0b2d27] bg-[#123d35] px-4 text-white sm:px-6">
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            aria-hidden="true"
            style={{
              backgroundImage:
                'radial-gradient(ellipse at 78% 120%, transparent 0 24%, #84bda6 24.5% 25%, transparent 25.5% 36%, #84bda6 36.5% 37%, transparent 37.5% 49%, #84bda6 49.5% 50%, transparent 50.5%)',
            }}
          />
          <div className="pointer-events-none absolute -right-6 top-1/2 h-px w-40 bg-[#6ed2ca]/50 sm:right-10 sm:w-64" aria-hidden="true" />
          <div className="pointer-events-none absolute right-32 top-1/2 size-2 -translate-y-1/2 rounded-full bg-[#f16f51] shadow-[0_0_0_5px_rgba(241,111,81,0.18)] sm:right-72" aria-hidden="true" />

          <div className="relative flex min-w-0 items-center gap-3">
            <SidebarTrigger className="-ml-1 text-white hover:bg-white/10 hover:text-white" />
            <div className="h-9 w-px bg-white/20" aria-hidden="true" />
            <WildlifeTrackerLogo className="size-12" decorative />
            <div className="min-w-0">
              <p className="truncate text-lg font-bold leading-tight sm:text-xl">Wildlife Tracker</p>
              <p className="truncate text-xs text-[#b9d8cc] sm:text-sm">
                Follow every signal. Protect every animal.
              </p>
            </div>
          </div>

          <div className="relative ml-auto hidden items-center gap-2 pl-6 text-xs font-semibold uppercase tracking-widest text-[#d9e66a] md:flex">
            <span className="size-1.5 rounded-full bg-[#6ed2ca] shadow-[0_0_8px_#6ed2ca]" />
            Field intelligence
          </div>
        </header>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
