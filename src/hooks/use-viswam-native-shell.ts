import { useEffect, useState } from 'react';
import { applyViswamNativeShellClass, isViswamNativeShell } from '@/lib/native-shell';

/** True when running inside the VISWAM React Native app WebView. */
export function useViswamNativeShell(): boolean {
  const [nativeShell, setNativeShell] = useState(() => isViswamNativeShell());

  useEffect(() => {
    applyViswamNativeShellClass();
    setNativeShell(isViswamNativeShell());
  }, []);

  return nativeShell;
}
