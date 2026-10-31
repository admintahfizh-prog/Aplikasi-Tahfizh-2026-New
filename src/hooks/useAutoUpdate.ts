import { useState, useEffect, useCallback, useRef } from 'react';

const LOCAL_STORAGE_VERSION_KEY = 'tahfizh_app_build_timestamp';
const CHECK_INTERVAL_MS = 60 * 1000; // Check every 60 seconds

export interface VersionInfo {
  version: string;
  buildTimestamp: number;
  releaseDate?: string;
  changeSummary?: string;
}

export function useAutoUpdate() {
  const [hasUpdate, setHasUpdate] = useState<boolean>(false);
  const [newVersionInfo, setNewVersionInfo] = useState<VersionInfo | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const isReloadingRef = useRef<boolean>(false);

  const checkForUpdate = useCallback(async (autoReloadOnDetect = false) => {
    if (isReloadingRef.current) return;
    setIsChecking(true);

    try {
      // Bust browser HTTP cache by querying with timestamp
      const res = await fetch(`/version.json?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache'
        }
      });

      if (!res.ok) return;
      const remoteInfo: VersionInfo = await res.json();

      const storedTimestampStr = localStorage.getItem(LOCAL_STORAGE_VERSION_KEY);
      const storedTimestamp = storedTimestampStr ? parseInt(storedTimestampStr, 10) : null;

      // If no stored timestamp, initialize it with current remote timestamp
      if (!storedTimestamp) {
        localStorage.setItem(LOCAL_STORAGE_VERSION_KEY, String(remoteInfo.buildTimestamp));
        return;
      }

      // If remote timestamp is newer than stored timestamp -> update detected!
      if (remoteInfo.buildTimestamp > storedTimestamp) {
        setHasUpdate(true);
        setNewVersionInfo(remoteInfo);

        if (autoReloadOnDetect) {
          isReloadingRef.current = true;
          // Clear any client caches
          if ('caches' in window) {
            try {
              const cacheNames = await caches.keys();
              await Promise.all(cacheNames.map(name => caches.delete(name)));
            } catch (e) {
              console.warn('Cache clearing error:', e);
            }
          }
          localStorage.setItem(LOCAL_STORAGE_VERSION_KEY, String(remoteInfo.buildTimestamp));
          // Seamless auto reload
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      }
    } catch (err) {
      // Offline or network error - fail silently
      console.warn('[AutoUpdate] Check skipped:', err);
    } finally {
      setIsChecking(false);
    }
  }, []);

  const applyUpdateNow = useCallback(async () => {
    if (isReloadingRef.current) return;
    isReloadingRef.current = true;

    if (newVersionInfo) {
      localStorage.setItem(LOCAL_STORAGE_VERSION_KEY, String(newVersionInfo.buildTimestamp));
    }

    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      } catch (e) {
        console.warn('Cache clearing error:', e);
      }
    }

    window.location.reload();
  }, [newVersionInfo]);

  useEffect(() => {
    // Initial check (quietly initialize or detect)
    checkForUpdate(true);

    // Periodic check in background
    const interval = setInterval(() => {
      checkForUpdate(true);
    }, CHECK_INTERVAL_MS);

    // Also check whenever user switches back to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkForUpdate]);

  return {
    hasUpdate,
    newVersionInfo,
    isChecking,
    checkForUpdate: () => checkForUpdate(false),
    applyUpdateNow
  };
}
