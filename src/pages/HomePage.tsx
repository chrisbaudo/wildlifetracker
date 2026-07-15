import { type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, XAxis } from 'recharts';

import ActivityIcon from 'lucide-react/dist/esm/icons/activity';
import CircleCheck from 'lucide-react/dist/esm/icons/circle-check';
import ClipboardList from 'lucide-react/dist/esm/icons/clipboard-list';
import Leaf from 'lucide-react/dist/esm/icons/leaf';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Navigation from 'lucide-react/dist/esm/icons/navigation';
import PawPrint from 'lucide-react/dist/esm/icons/paw-print';
import RadioTower from 'lucide-react/dist/esm/icons/radio-tower';
import Satellite from 'lucide-react/dist/esm/icons/satellite';
import TriangleAlert from 'lucide-react/dist/esm/icons/triangle-alert';
import Users from 'lucide-react/dist/esm/icons/users';
import WifiOff from 'lucide-react/dist/esm/icons/wifi-off';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useDashboard, type DashboardStats } from '@/hooks/useDashboard';

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant?: 'default' | 'destructive';
}

function StatCard({ title, value, icon: Icon, variant = 'default' }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between pt-0">
        <span
          className={`text-2xl font-bold ${variant === 'destructive' && value > 0 ? 'text-destructive' : 'text-foreground'}`}
        >
          {value}
        </span>
        <Icon
          size={20}
          className={variant === 'destructive' && value > 0 ? 'text-destructive' : 'text-muted-foreground'}
        />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Horizontal bar breakdown
// ---------------------------------------------------------------------------

function BarList({ entries }: { entries: { name: string; count: number }[] }) {
  if (entries.length === 0) return <p className="text-sm text-muted-foreground">No data.</p>;
  const max = entries[0].count || 1;
  return (
    <ul className="space-y-2.5">
      {entries.map(entry => (
        <li key={entry.name} className="text-sm">
          <div className="flex justify-between mb-1">
            <span className="truncate text-foreground">{entry.name}</span>
            <span className="text-muted-foreground ml-2 shrink-0 tabular-nums">{entry.count}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(entry.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statsSummary(stats: DashboardStats): string {
  const parts: string[] = [];
  if (stats.activeAnimals > 0) parts.push(`${stats.activeAnimals} active`);
  if (stats.collaredAnimals > 0) parts.push(`${stats.collaredAnimals} collared`);
  return parts.join(' · ');
}

// ---------------------------------------------------------------------------
// Quick link nav cards
// ---------------------------------------------------------------------------

const NAV_CARDS: { title: string; href: string; icon: LucideIcon }[] = [
  { title: 'Animals',            href: '/animals',            icon: PawPrint },
  { title: 'Collar Deployments', href: '/collar-deployments', icon: Satellite },
  { title: 'Captures',           href: '/captures',           icon: ClipboardList },
  { title: 'Telemetry',          href: '/telemetry',          icon: Navigation },
  { title: 'Study Areas',        href: '/study-areas',        icon: MapPin },
  { title: 'Species',            href: '/species',            icon: Leaf },
  { title: 'Collar Models',      href: '/collar-models',      icon: RadioTower },
  { title: 'Personnel',          href: '/personnel',          icon: Users },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function HomePage() {
  const {
    stats, alerts, activity,
    bySpecies, byStudyArea, capturesByMonth,
    loading, error,
  } = useDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-muted-foreground" size={28} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-8 py-10">
        <p className="text-destructive text-sm">Failed to load dashboard: {error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-10 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          {stats.totalAnimals > 0 ? statsSummary(stats) : 'Wildlife tracking overview.'}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Total Animals"  value={stats.totalAnimals}    icon={PawPrint} />
        <StatCard title="Active"         value={stats.activeAnimals}   icon={ActivityIcon} />
        <StatCard title="Collared"       value={stats.collaredAnimals} icon={Satellite} />
        <StatCard title="Captures (30d)" value={stats.recentCaptures}  icon={ClipboardList} />
        <StatCard
          title="Mortality"
          value={stats.mortalityCount}
          icon={TriangleAlert}
          variant={stats.mortalityCount > 0 ? 'destructive' : 'default'}
        />
      </div>

      {/* Alerts + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TriangleAlert size={15} className="text-muted-foreground" />
              Alerts
              {alerts.length > 0 && (
                <Badge variant="destructive" className="ml-1">{alerts.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CircleCheck size={16} className="text-green-500" />
                All animals are active and monitored.
              </div>
            ) : (
              <ul className="divide-y">
                {alerts.map(alert => (
                  <li key={alert.id} className="flex items-start gap-3 py-2 first:pt-0 last:pb-0 text-sm">
                    {alert.type === 'mortality' ? (
                      <TriangleAlert size={15} className="mt-0.5 shrink-0 text-destructive" />
                    ) : (
                      <WifiOff size={15} className="mt-0.5 shrink-0 text-amber-500" />
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="font-medium">{alert.animalId}</span>
                      <span className="text-muted-foreground"> · {alert.earTagId} · {alert.speciesName}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{alert.detail}</p>
                    </div>
                    <Badge
                      variant={alert.type === 'mortality' ? 'destructive' : 'outline'}
                      className="shrink-0"
                    >
                      {alert.type === 'mortality' ? 'Mortality' : 'Unmonitored'}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ActivityIcon size={15} className="text-muted-foreground" />
              Recent Captures
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent captures.</p>
            ) : (
              <div className="divide-y">
                {activity.map(item => (
                  <div key={item.id} className="py-2 first:pt-0 last:pb-0">
                    <p className="text-sm font-medium leading-tight">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.sub}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.date.toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Breakdowns + Captures chart */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Leaf size={15} className="text-muted-foreground" />
              Animals by Species
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarList entries={bySpecies} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MapPin size={15} className="text-muted-foreground" />
              Animals by Study Area
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarList entries={byStudyArea} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ClipboardList size={15} className="text-muted-foreground" />
              Captures — Last 6 Months
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ count: { label: 'Captures', color: 'hsl(var(--chart-1))' } }}
              className="h-40 w-full"
            >
              <BarChart data={capturesByMonth} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Quick Links
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {NAV_CARDS.map(card => (
            <Link key={card.href} to={card.href} className="group">
              <Card className="transition-shadow group-hover:shadow-md py-3">
                <CardContent className="flex items-center gap-3 px-4 py-0">
                  <card.icon size={16} className="text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium">{card.title}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
