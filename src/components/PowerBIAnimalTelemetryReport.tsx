import { useEffect, useRef, useState } from 'react';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import LoaderCircle from 'lucide-react/dist/esm/icons/loader-circle';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import { factories, models, service, type Report } from 'powerbi-client';

import { Button } from '@/components/ui/button';
import { getPowerBIAccessToken } from '@/services/fabricEmbedAuth';

const powerbi = new service.Service(
  factories.hpmFactory,
  factories.wpmpFactory,
  factories.routerFactory,
);

interface PowerBIAnimalTelemetryReportProps {
  animalId: string;
}

export function PowerBIAnimalTelemetryReport({
  animalId,
}: PowerBIAnimalTelemetryReportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const reportId = import.meta.env.VITE_RAYFIN_POWERBI_TELEMETRY_REPORT_ID;
  const embedUrl = import.meta.env.VITE_RAYFIN_POWERBI_TELEMETRY_REPORT_EMBED_URL;
  const reportUrl = import.meta.env.VITE_RAYFIN_POWERBI_TELEMETRY_REPORT_URL;
  const configured = Boolean(reportId && embedUrl);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !configured || !reportId || !embedUrl) return;

    let disposed = false;

    async function embedReport() {
      try {
        setStatus('loading');
        setErrorMessage('');

        const accessToken = await getPowerBIAccessToken();
        if (disposed || !containerRef.current) return;

        const animalFilter: models.IBasicFilter = {
          $schema: 'http://powerbi.com/product/schema#basic',
          target: { table: 'Query', column: 'animal_id' },
          operator: 'In',
          values: [animalId],
          filterType: models.FilterType.Basic,
        };
        const report = powerbi.embed(containerRef.current, {
          type: 'report',
          id: reportId,
          embedUrl,
          accessToken,
          tokenType: models.TokenType.Aad,
          filters: [animalFilter],
          settings: {
            background: models.BackgroundType.Transparent,
            layoutType: models.LayoutType.Custom,
            customLayout: {
              displayOption: models.DisplayOption.FitToWidth,
              reportAlignment: models.ReportAlignment.Center,
            },
            panes: {
              filters: { visible: false },
              pageNavigation: { visible: false },
            },
          },
          eventHooks: {
            accessTokenProvider: () => getPowerBIAccessToken(),
          },
        }) as Report;

        report.on('rendered', () => {
          if (!disposed) setStatus('ready');
        });
        report.on('error', (event) => {
          if (!disposed) {
            const detail = event?.detail as { message?: string } | undefined;
            setErrorMessage(detail?.message || 'Power BI could not render the report.');
            setStatus('error');
          }
        });
      } catch (error) {
        if (!disposed) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load the report.');
          setStatus('error');
        }
      }
    }

    void embedReport();

    return () => {
      disposed = true;
      powerbi.reset(container);
    };
  }, [animalId, configured, embedUrl, reportId]);

  if (!configured) {
    return (
      <div className="flex aspect-video items-center justify-center bg-muted/20 px-6 text-center">
        <div className="space-y-3">
          <MapPin className="mx-auto text-muted-foreground" size={28} />
          <p className="text-sm font-medium text-foreground">Power BI telemetry report is not configured</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-background">
      <div
        ref={containerRef}
        className="h-full w-full"
        role="region"
        aria-label={`${animalId} telemetry report`}
        tabIndex={0}
      />
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-background">
          <LoaderCircle className="animate-spin text-muted-foreground" size={26} />
          <span className="sr-only">Loading {animalId} telemetry report</span>
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-background px-6 text-center">
          <div className="max-w-md space-y-3">
            <MapPin className="mx-auto text-muted-foreground" size={28} />
            <p className="text-sm font-medium text-foreground">Telemetry report unavailable</p>
            <p className="text-xs text-muted-foreground">{errorMessage}</p>
            {reportUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={reportUrl} target="_blank" rel="noreferrer">
                  Open in Power BI <ExternalLink size={14} />
                </a>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}