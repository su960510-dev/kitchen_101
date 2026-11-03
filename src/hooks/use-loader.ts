import { useIsFocused } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { logError } from '@/domain/errors';

import { useAppState } from './app-state';

/** 화면에 포커스가 있을 때 불러오고, 포커스 복귀·데이터 변경·deps 변경 시 다시 불러온다. */
export function useLoader<T>(load: () => Promise<T>, deps: unknown[] = []): { data: T | undefined; error: boolean; loading: boolean; reload: () => void } {
  const { dataVersion, ready } = useAppState();
  const isFocused = useIsFocused();
  const [data, setData] = useState<T>();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);
  const seq = useRef(0);
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });
  const depsKey = JSON.stringify(deps);

  useEffect(() => {
    if (!ready || !isFocused) return;
    const id = ++seq.current;
    loadRef
      .current()
      .then((d) => {
        if (id !== seq.current) return;
        setData(d);
        setError(false);
      })
      .catch((e) => {
        logError('load', e);
        if (id === seq.current) setError(true);
      })
      .finally(() => {
        if (id === seq.current) setLoading(false);
      });
  }, [ready, isFocused, dataVersion, depsKey, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { data, error, loading, reload };
}
