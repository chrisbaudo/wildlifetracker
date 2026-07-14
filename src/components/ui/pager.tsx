import { Button } from '@/components/ui/button';

interface PagerProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

export function Pager({ page, pageCount, onPageChange }: PagerProps) {
  if (pageCount <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-muted-foreground">
      <span>Page {page} of {pageCount}</span>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={page === 1}
          onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <Button size="sm" variant="outline" disabled={page === pageCount}
          onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
