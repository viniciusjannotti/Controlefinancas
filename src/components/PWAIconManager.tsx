"use client";

import { useEffect } from "react";
import { useGame } from "@/lib/game/GameContext";

export function PWAIconManager() {
  const { gameData, loading } = useGame();

  useEffect(() => {
    if (loading) return;

    const level = gameData.level || 1;
    const iconUrl = `/api/pwa/icon?level=${level}`;
    const manifestUrl = `/api/pwa/manifest?level=${level}`;

    // Update Favicon
    const updateLink = (rel: string, href: string, type?: string) => {
      let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.rel = rel;
        document.head.appendChild(link);
      }
      link.href = href;
      if (type) link.type = type;
    };

    // Update standard icons
    updateLink("icon", iconUrl, "image/svg+xml");
    updateLink("apple-touch-icon", iconUrl);
    
    // Update Manifest link
    // We try to find potential variants of the manifest link rel
    const manifestLinks = document.querySelectorAll('link[rel="manifest"]');
    if (manifestLinks.length > 0) {
      manifestLinks.forEach(link => {
        (link as HTMLLinkElement).href = manifestUrl;
      });
    } else {
      const link = document.createElement("link");
      link.rel = "manifest";
      link.href = manifestUrl;
      document.head.appendChild(link);
    }

    console.debug(`[PWAIconManager] Updated icon and manifest for level ${level}`);
  }, [gameData.level, loading]);

  return null; // This component doesn't render anything
}
