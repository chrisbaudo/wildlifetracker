import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const NAV_CARDS = [
  {
    title: 'Animals',
    description: 'Track individual animals — ear tags, age class, status, and collar assignments.',
    href: '/animals',
    icon: '🐾',
  },
  {
    title: 'Collar Deployments',
    description: 'Track which collar is deployed on which animal, with start and end dates.',
    href: '/collar-deployments',
    icon: '📡',
  },
  {
    title: 'Captures',
    description: 'Log capture events — biometrics, samples, capture method, and personnel.',
    href: '/captures',
    icon: '📋',
  },
  {
    title: 'Telemetry',
    description: 'View GPS fix tracks on an interactive map. Read-only.',
    href: '/telemetry',
    icon: '🗺️',
  },
  {
    title: 'Study Areas',
    description: 'Manage populations, GMUs, and migratory study area boundaries.',
    href: '/study-areas',
    icon: '📍',
  },
  {
    title: 'Species',
    description: 'Reference list of tracked species with common and scientific names.',
    href: '/species',
    icon: '🦌',
  },
  {
    title: 'Collar Models',
    description: 'Manage GPS collar vendors, fix intervals, and battery life specifications.',
    href: '/collar-models',
    icon: '📡',
  },
  {
    title: 'Personnel',
    description: 'Manage field biologists and pilots involved in capture operations.',
    href: '/personnel',
    icon: '👤',
  },
];

export function HomePage() {
  return (
    <div className="max-w-4xl mx-auto px-8 py-12">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage your wildlife tracking data.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {NAV_CARDS.map((card) => (
          <Link key={card.href} to={card.href} className="group">
            <Card className="h-full transition-shadow group-hover:shadow-md">
              <CardHeader>
                <div className="text-3xl mb-2">{card.icon}</div>
                <CardTitle className="text-base">{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" size="sm" className="w-full">
                  Open
                </Button>
              </CardContent>
              </Card>
            </Link>
          ))}
        </div>
    </div>
  );
}
