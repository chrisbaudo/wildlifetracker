import { useMemo, useState } from 'react';

export function useSearch<T>(items: T[]) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(item =>
      Object.values(item as Record<string, unknown>).some(
        v => typeof v === 'string' && v.toLowerCase().includes(q),
      )
    );
  }, [items, search]);
  return { search, setSearch, filtered };
}
