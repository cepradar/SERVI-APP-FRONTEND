import { useCallback, useEffect, useRef, useState } from 'react';
import axiosClient from '../api/axiosClient';

/**
 * Hook genérico para realizar peticiones GET a la API.
 * Gestiona loading, error, datos y re-fetch automático.
 *
 * @param {string|null} url  - Endpoint relativo. Si es null/undefined no hace fetch.
 * @param {object}      [options]
 * @param {object}      [options.params]     - Query params.
 * @param {boolean}     [options.immediate]  - Si debe hacer fetch al montar (default: true).
 * @returns {{ data, loading, error, refetch }}
 *
 * @example
 * const { data: clients, loading, refetch } = useFetch('/api/clientes/listar');
 */
export function useFetch(url, { params, immediate = true } = {}) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(immediate && !!url);
  const [error, setError]     = useState(null);
  const abortRef = useRef(null);

  const fetch = useCallback(async () => {
    if (!url) return;

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const res = await axiosClient.get(url, {
        params,
        signal: abortRef.current.signal,
      });
      setData(res.data);
    } catch (err) {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [url, JSON.stringify(params)]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (immediate) fetch();
    return () => abortRef.current?.abort();
  }, [fetch, immediate]);

  return { data, loading, error, refetch: fetch };
}
