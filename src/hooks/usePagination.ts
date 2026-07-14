import { useEffect, useState } from 'react';

export function usePagination<T>(items: T[], pageSize = 10) {
  const [page, setPage] = useState(1);

  // Reset to first page whenever the item list is replaced (after CRUD ops)
  useEffect(() => { setPage(1); }, [items]);

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageItems = items.slice((safePage - 1) * pageSize, safePage * pageSize);

  return { page: safePage, setPage, pageItems, pageCount };
}
