import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import sedeService from '../api/services/sedeService';

const STORAGE_SEDES       = 'userSedes';
const STORAGE_SEDE_ACTUAL = 'sedeActual';

const SedesContext = createContext({
  sedes:      [],
  sedeActual: null,
  loading:    false,
  setSede:    () => {},
  reload:     () => {},
});

export function SedesProvider({ children }) {
  const [sedes, setSedes] = useState(() => {
    try {
      const v = localStorage.getItem(STORAGE_SEDES);
      return v ? JSON.parse(v) : [];
    } catch {
      return [];
    }
  });

  const [sedeActual, setSedeActual] = useState(() => {
    try {
      const v = localStorage.getItem(STORAGE_SEDE_ACTUAL);
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setSedes([]);
      setSedeActual(null);
      localStorage.removeItem(STORAGE_SEDES);
      localStorage.removeItem(STORAGE_SEDE_ACTUAL);
      return;
    }
    setLoading(true);
    try {
      const res = await sedeService.getMisSedes();
      const data = Array.isArray(res.data) ? res.data : [];
      setSedes(data);
      localStorage.setItem(STORAGE_SEDES, JSON.stringify(data));

      // Mantener la sede seleccionada si sigue siendo válida
      const storedActual = localStorage.getItem(STORAGE_SEDE_ACTUAL);
      if (storedActual) {
        const parsed = JSON.parse(storedActual);
        const stillValid = data.find((s) => s.codigoSede === parsed.codigoSede);
        if (stillValid) {
          setSedeActual(stillValid);
        } else if (data.length > 0) {
          setSedeActual(data[0]);
          localStorage.setItem(STORAGE_SEDE_ACTUAL, JSON.stringify(data[0]));
        } else {
          setSedeActual(null);
          localStorage.removeItem(STORAGE_SEDE_ACTUAL);
        }
      } else if (data.length > 0) {
        setSedeActual(data[0]);
        localStorage.setItem(STORAGE_SEDE_ACTUAL, JSON.stringify(data[0]));
      }
    } catch {
      // Si el endpoint no existe aún, no romper la app
      setSedes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setSede = useCallback((sede) => {
    setSedeActual(sede);
    if (sede) {
      localStorage.setItem(STORAGE_SEDE_ACTUAL, JSON.stringify(sede));
    } else {
      localStorage.removeItem(STORAGE_SEDE_ACTUAL);
    }
  }, []);

  return (
    <SedesContext.Provider value={{ sedes, sedeActual, loading, setSede, reload: load }}>
      {children}
    </SedesContext.Provider>
  );
}

export function useSedes() {
  return useContext(SedesContext);
}
