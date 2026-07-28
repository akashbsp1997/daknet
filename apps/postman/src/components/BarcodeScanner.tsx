import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface BarcodeScannerProps {
  onResult: (result: string) => void;
  onError?: (error: any) => void;
}

export function BarcodeScanner({ onResult, onError }: BarcodeScannerProps) {
  // Read the latest callbacks through refs rather than depending on them
  // directly in the effect below — the caller's onResult/onError often
  // aren't stable across renders (e.g. a closure over other state), and
  // depending on them here would tear down and restart the camera mid-scan
  // every time the parent re-renders while scanning is in progress.
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        scanner.pause(true);
        onResultRef.current(decodedText);
      },
      (error) => {
        onErrorRef.current?.(error);
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
    // Mount the camera once per scan session — see the refs above for why
    // onResult/onError aren't in this list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full max-w-md mx-auto overflow-hidden rounded-xl bg-black">
      <div id="qr-reader" className="w-full"></div>
    </div>
  );
}
