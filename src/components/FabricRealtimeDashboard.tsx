import { useEffect, useRef, useState } from 'react';
import {
  EmbedManager,
  KQLDashboardEmbedClient,
  type ErrorEvent as FabricEmbedErrorEvent,
  type KQLDashboardEmbedConfiguration,
} from '@microsoft/fabric-embed';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import LoaderCircle from 'lucide-react/dist/esm/icons/loader-circle';
import RadioTower from 'lucide-react/dist/esm/icons/radio-tower';

import { Button } from '@/components/ui/button';
import { getFabricEmbedAccessToken } from '@/services/fabricEmbedAuth';

const embedManager = new EmbedManager({
  embedClientClasses: [KQLDashboardEmbedClient],
});

interface FabricRealtimeDashboardProps {
  animalId?: string;
  className?: string;
  height?: number | string;
  title?: string;
}

export function FabricRealtimeDashboard({
  animalId,
  className = '',
  height = 520,
  title = 'Wildlife Telemetry Live',
}: FabricRealtimeDashboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const clientId = import.meta.env.VITE_RAYFIN_REALTIME_DASHBOARD_CLIENT_ID;
  const tenantId = import.meta.env.VITE_FABRIC_TENANT_ID;
  const workspaceId = import.meta.env.VITE_FABRIC_WORKSPACE_ID;
  const itemId = import.meta.env.VITE_RAYFIN_REALTIME_DASHBOARD_ITEM_ID;
  const dashboardUrl = import.meta.env.VITE_RAYFIN_REALTIME_DASHBOARD_URL;
  const configured = Boolean(clientId && tenantId && workspaceId && itemId);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !configured || !workspaceId || !itemId) return;

    const resolvedItemId = itemId;
    const resolvedWorkspaceId = workspaceId;
    let disposed = false;

    async function embedDashboard() {
      try {
        setStatus('loading');
        setErrorMessage('');

        const initialToken = await getFabricEmbedAccessToken();
        const config: KQLDashboardEmbedConfiguration = {
          accessToken: { token: initialToken },
          itemId: resolvedItemId,
          itemType: 'KQLDashboard',
          workspaceId: resolvedWorkspaceId,
          queryParams: animalId ? { 'param-_animalId': animalId } : undefined,
          eventHooks: {
            accessTokenProvider: {
              callback: async ({ scopes }) => ({
                token: await getFabricEmbedAccessToken(scopes),
              }),
            },
          },
        };

        if (disposed || !containerRef.current) return;
        const embedClient = embedManager.embed(containerRef.current, config);
        embedClient.on('rendered', () => {
          if (!disposed) setStatus('ready');
        });
        embedClient.on('error', (event: FabricEmbedErrorEvent) => {
          if (!disposed) {
            setErrorMessage(event.message || 'Microsoft Fabric could not render the dashboard.');
            setStatus('error');
          }
        });
      } catch (error) {
        if (!disposed) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load the dashboard.');
          setStatus('error');
        }
      }
    }

    void embedDashboard();

    return () => {
      disposed = true;
      embedManager.reset(container);
    };
  }, [animalId, configured, itemId, workspaceId]);

  if (!configured) {
    return (
      <div
        className={`flex items-center justify-center border border-dashed border-border bg-muted/20 px-6 text-center ${className}`}
        style={{ minHeight: height }}
      >
        <div className="max-w-sm space-y-3">
          <RadioTower className="mx-auto text-muted-foreground" size={28} />
          <div>
            <p className="text-sm font-medium text-foreground">Wildlife map dashboard</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Fabric Embed is not configured. Open the live dashboard in Microsoft Fabric.
            </p>
          </div>
          {dashboardUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={dashboardUrl} target="_blank" rel="noreferrer">
                Open wildlifemap <ExternalLink size={14} />
              </a>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full overflow-hidden bg-background ${className}`}
      style={{ height }}
    >
      <div
        ref={containerRef}
        className="h-full w-full"
        role="region"
        aria-label={title}
        tabIndex={0}
      />
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-background">
          <LoaderCircle className="animate-spin text-muted-foreground" size={26} />
          <span className="sr-only">Loading {title}</span>
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-background px-6 text-center">
          <div className="max-w-md space-y-3">
            <RadioTower className="mx-auto text-muted-foreground" size={28} />
            <p className="text-sm font-medium text-foreground">Dashboard unavailable</p>
            <p className="text-xs text-muted-foreground">{errorMessage}</p>
            {dashboardUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={dashboardUrl} target="_blank" rel="noreferrer">
                  Open in Fabric <ExternalLink size={14} />
                </a>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}