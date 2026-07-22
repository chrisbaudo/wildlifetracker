import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up';
import ChevronsUpDown from 'lucide-react/dist/esm/icons/chevrons-up-down';

import { TableHead } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface SortableHeadProps {
  label: string;
  sortKey: string;
  currentKey: string | null;
  dir: 'asc' | 'desc';
  onSort: (key: string) => void;
  className?: string;
}

export function SortableHead({
  label, sortKey, currentKey, dir, onSort, className,
}: SortableHeadProps) {
  const active = currentKey === sortKey;
  return (
    <TableHead
      className={cn('cursor-pointer select-none whitespace-nowrap', className)}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active
          ? (dir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />)
          : <ChevronsUpDown size={13} className="opacity-30" />
        }
      </span>
    </TableHead>
  );
}
