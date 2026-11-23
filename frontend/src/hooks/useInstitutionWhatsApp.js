import { useEffect, useState } from 'react';

export const useInstitutionWhatsApp = (message) => {
  const [url, setUrl] = useState('');

  useEffect(() => {
    let active = true;

    const cargarWhatsApp = async () => {
      try {
        const response = await fetch('/api/institucion');

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const resultado = await response.json();
        const info = resultado.data ?? resultado;

        const numero = String(info?.whatsapp ?? '')
          .replace(/\D/g, '');

        if (active) {
          setUrl(
            numero.length >= 8
              ? `https://wa.me/${numero}?text=${encodeURIComponent(message)}`
              : ''
          );
        }
      } catch (error) {
        console.warn('No se pudo obtener el WhatsApp institucional:', error);

        if (active) {
          setUrl('');
        }
      }
    };

    cargarWhatsApp();

    return () => {
      active = false;
    };
  }, [message]);

  return url;
};
