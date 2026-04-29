"use client";

import { useEffect, useState } from "react";

interface AdminSurfaceState {
  isReady: boolean;
  isStandalone: boolean;
  isDesktopBrowser: boolean;
  canAccessAdminSurface: boolean;
}

const DESKTOP_BROWSER_QUERY = "(hover: hover) and (pointer: fine)";
const STANDALONE_QUERY = "(display-mode: standalone)";

function isProbablyMobileUserAgent() {
  if (typeof navigator === "undefined") return false;

  return /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent);
}

function supportsEventTarget(query: MediaQueryList) {
  return typeof query.addEventListener === "function";
}

export function useAdminSurface(): AdminSurfaceState {
  const [state, setState] = useState<AdminSurfaceState>({
    isReady: false,
    isStandalone: false,
    isDesktopBrowser: false,
    canAccessAdminSurface: false,
  });

  useEffect(() => {
    const desktopQuery = window.matchMedia(DESKTOP_BROWSER_QUERY);
    const standaloneQuery = window.matchMedia(STANDALONE_QUERY);

    function updateState() {
      const isStandalone =
        standaloneQuery.matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      const isDesktopBrowser = desktopQuery.matches && !isProbablyMobileUserAgent();

      setState({
        isReady: true,
        isStandalone,
        isDesktopBrowser,
        canAccessAdminSurface: isDesktopBrowser && !isStandalone,
      });
    }

    updateState();

    if (supportsEventTarget(desktopQuery)) {
      desktopQuery.addEventListener("change", updateState);
      standaloneQuery.addEventListener("change", updateState);

      return () => {
        desktopQuery.removeEventListener("change", updateState);
        standaloneQuery.removeEventListener("change", updateState);
      };
    }

    desktopQuery.addListener(updateState);
    standaloneQuery.addListener(updateState);

    return () => {
      desktopQuery.removeListener(updateState);
      standaloneQuery.removeListener(updateState);
    };
  }, []);

  return state;
}
