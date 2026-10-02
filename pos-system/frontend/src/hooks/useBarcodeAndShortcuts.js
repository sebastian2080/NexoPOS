import { useEffect, useRef } from 'react';

export function useBarcodeAndShortcuts({
  onBarcodeScan,
  onFocusSearch,
  onQuickCheckout,
  onClearCart,
  onEscape
}) {
  const barcodeBuffer = useRef('');
  const lastKeyTime = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Manejo seguro por si e.target o tagName no existen
      const targetTag = e?.target?.tagName ? e.target.tagName.toLowerCase() : '';
      const isInputFocused = targetTag === 'input' || targetTag === 'textarea';

      // 1. ATAJOS DE TECLADO
      if (e.key === 'F1' || e.key === 'F2') {
        e.preventDefault();
        onFocusSearch?.();
        return;
      }
      if (e.key === 'F4' || e.key === 'F8') {
        e.preventDefault();
        onClearCart?.();
        return;
      }
      if (e.key === 'F12') {
        e.preventDefault();
        onQuickCheckout?.();
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onEscape?.();
        return;
      }

      // 2. DETECCIÓN DE LECTOR DE CÓDIGO DE BARRAS
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime.current;
      lastKeyTime.current = currentTime;

      // Si pasa más de 60ms entre teclas, se reinicia el buffer (escritura manual)
      if (timeDiff > 60) {
        barcodeBuffer.current = '';
      }

      if (e.key === 'Enter') {
        if (barcodeBuffer.current.length >= 3) {
          e.preventDefault();
          const scannedCode = barcodeBuffer.current;
          barcodeBuffer.current = '';
          onBarcodeScan?.(scannedCode);
        }
        return;
      }

      if (e.key && e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBarcodeScan, onFocusSearch, onQuickCheckout, onClearCart, onEscape]);
}