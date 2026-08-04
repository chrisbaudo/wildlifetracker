import { Bar, BarChart, XAxis } from 'recharts';

import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { MonthlyCapture } from '@/hooks/useDashboard';

export function CapturesByMonthChart({ data }: { data: MonthlyCapture[] }) {
  return (
    <ChartContainer
      config={{ count: { label: 'Captures', color: 'hsl(var(--chart-1))' } }}
      className="h-40 w-full"
    >
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}