import { useEffect, useRef, useState } from 'react';
import companyService from '../api/services/companyService';

/**
 * Hook reutilizable para cargar la información y logo de la empresa.
 * Evita la duplicación de esta lógica en Login, Dashboard y LandingPage.
 *
 * @param {'logo'|'logo2'} [logoVariant='logo'] - Cuál de los logos cargar.
 * @returns {{ companyInfo: object|null, logoUrl: string, loading: boolean }}
 */
export function useCompanyInfo(logoVariant = 'logo') {
  const [companyInfo, setCompanyInfo] = useState(null);
  const [logoUrl, setLogoUrl]         = useState('');
  const [loading, setLoading]         = useState(true);
  const objectUrlRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const infoRes = await companyService.getInfo();
        if (!isMounted) return;
        setCompanyInfo(infoRes.data || null);

        const id = infoRes.data?.id;
        if (id) {
          try {
            const fetchLogo = logoVariant === 'logo2'
              ? companyService.getLogo2(id)
              : companyService.getLogo(id);

            const logoRes = await fetchLogo;
            if (!isMounted) return;
            const url = URL.createObjectURL(logoRes.data);
            objectUrlRef.current = url;
            setLogoUrl(url);
          } catch {
            // Logo no disponible — no es error crítico
          }
        }
      } catch {
        // Info de empresa no disponible — no es error crítico
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [logoVariant]);

  return { companyInfo, logoUrl, loading };
}
