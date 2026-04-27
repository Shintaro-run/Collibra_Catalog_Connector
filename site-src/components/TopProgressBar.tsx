'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function TopProgressBar() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    setProgress(15);
    let cancelled = false;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const next = Math.min(90, 15 + Math.sqrt(elapsed) * 4);
      if (!cancelled) {
        setProgress(next);
        if (next < 90) requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
    const finish = window.setTimeout(() => {
      cancelled = true;
      setProgress(100);
      window.setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 240);
    }, 320);

    return () => {
      cancelled = true;
      window.clearTimeout(finish);
    };
  }, [pathname]);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] pointer-events-none"
      aria-hidden={!visible}
    >
      <div
        className="h-[2px] bg-gradient-to-r from-mint-500 via-cyan-400 to-fuchsia-400 shadow-[0_0_8px_rgba(45,212,191,0.7)] transition-[width,opacity]"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
          transitionDuration: visible ? '160ms' : '300ms',
        }}
      />
    </div>
  );
}
