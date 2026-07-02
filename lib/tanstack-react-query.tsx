'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

type QueryKey = readonly unknown[];
type QueryState<T> = { data?: T; error: Error | null; updatedAt: number; promise?: Promise<T> };
type QueryDefaults = { staleTime?: number; gcTime?: number; refetchOnWindowFocus?: boolean };

export class QueryClient {
  private cache = new Map<string, QueryState<unknown>>();
  constructor(private options: { defaultOptions?: { queries?: QueryDefaults } } = {}) {}
  getDefaults() { return this.options.defaultOptions?.queries ?? {}; }
  getQueryData<T>(queryKey: QueryKey): T | undefined { return this.cache.get(hashKey(queryKey))?.data as T | undefined; }
  getState<T>(queryKey: QueryKey) { return this.cache.get(hashKey(queryKey)) as QueryState<T> | undefined; }
  setQueryData<T>(queryKey: QueryKey, data: T) { this.cache.set(hashKey(queryKey), { data, error: null, updatedAt: Date.now() }); }
  setState<T>(queryKey: QueryKey, state: QueryState<T>) { this.cache.set(hashKey(queryKey), state as QueryState<unknown>); }
  invalidateQueries({ queryKey }: { queryKey: QueryKey }) { const prefix = hashKey(queryKey); for (const key of this.cache.keys()) if (key.startsWith(prefix)) this.cache.delete(key); }
}

const QueryClientContext = createContext<QueryClient | null>(null);

export function QueryClientProvider({ client, children }: { client: QueryClient; children: ReactNode }) {
  return <QueryClientContext.Provider value={client}>{children}</QueryClientContext.Provider>;
}

function hashKey(queryKey: QueryKey) { return JSON.stringify(queryKey); }

export function useQuery<T>({ queryKey, queryFn, enabled = true, staleTime, placeholderData }: { queryKey: QueryKey; queryFn: () => Promise<T>; enabled?: boolean; staleTime?: number; placeholderData?: T | ((previous?: T) => T | undefined) }) {
  const client = useContext(QueryClientContext);
  if (!client) throw new Error('useQuery must be used inside QueryClientProvider');
  const key = useMemo(() => hashKey(queryKey), [queryKey]);
  const previousData = useRef<T | undefined>(client.getQueryData<T>(queryKey));
  const initialState = client.getState<T>(queryKey);
  const placeholder = typeof placeholderData === 'function' ? (placeholderData as (previous?: T) => T | undefined)(previousData.current) : placeholderData;
  const [data, setData] = useState<T | undefined>(initialState?.data ?? placeholder);
  const [error, setError] = useState<Error | null>(initialState?.error ?? null);
  const [isFetching, setIsFetching] = useState(false);
  const [isLoading, setIsLoading] = useState(enabled && !initialState?.data);

  useEffect(() => {
    if (!enabled) return;
    let mounted = true;
    const defaults = client.getDefaults();
    const maxAge = staleTime ?? defaults.staleTime ?? 0;
    const cached = client.getState<T>(queryKey);
    const isFresh = cached?.data !== undefined && Date.now() - cached.updatedAt < maxAge;
    if (isFresh) { setData(cached.data); setError(cached.error); setIsLoading(false); return; }
    const promise = cached?.promise ?? queryFn();
    client.setState<T>(queryKey, { data: cached?.data, error: cached?.error ?? null, updatedAt: cached?.updatedAt ?? 0, promise });
    setIsFetching(true);
    setIsLoading(cached?.data === undefined);
    promise.then((nextData) => {
      client.setQueryData(queryKey, nextData);
      previousData.current = nextData;
      if (!mounted) return;
      setData(nextData);
      setError(null);
    }).catch((err: unknown) => {
      const nextError = err instanceof Error ? err : new Error('Falha ao carregar dados.');
      if (!mounted) return;
      setError(nextError);
    }).finally(() => {
      if (!mounted) return;
      setIsFetching(false);
      setIsLoading(false);
    });
    return () => { mounted = false; };
  }, [client, enabled, key, queryFn, queryKey, staleTime]);

  return { data, error, isFetching, isLoading, isPending: isLoading };
}

export const keepPreviousData = <T,>(previous?: T) => previous;
