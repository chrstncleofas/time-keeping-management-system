"use client";

import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';


export default function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient());
  useEffect(() => {
    (async () => {
      try {
        const settings = await apiClient.getSystemSettings();
        if (settings?.primaryColor) document.documentElement.style.setProperty('--primary-color', settings.primaryColor);
        if (settings?.accentColor) document.documentElement.style.setProperty('--accent-color', settings.accentColor);
        if (settings?.companyName) document.title = settings.companyName;
        if (settings?.faviconUrl) {
          try {
            const raw = settings.faviconUrl;
            const url = raw.includes('?') ? `${raw}&v=${Date.now()}` : `${raw}?v=${Date.now()}`;
            const link = document.querySelector("link[rel='icon'], link[rel='shortcut icon']") as HTMLLinkElement | null;
            if (link) {
              link.href = url;
            } else {
              const newLink = document.createElement('link');
              newLink.rel = 'icon';
              // try to set a sensible type
              newLink.type = raw.endsWith('.png') ? 'image/png' : raw.endsWith('.ico') ? 'image/x-icon' : 'image/*';
              newLink.href = url;
              document.head.appendChild(newLink);
            }
          } catch (e) {
            // ignore favicon errors
          }
        }
        // extended branding vars
        if (settings?.sidebarBg) document.documentElement.style.setProperty('--sidebar-bg', settings.sidebarBg);
        if (settings?.sidebarText) document.documentElement.style.setProperty('--sidebar-text', settings.sidebarText);
        if (settings?.sidebarActiveBg) document.documentElement.style.setProperty('--sidebar-active-bg', settings.sidebarActiveBg);
        if (settings?.sidebarHoverBg) document.documentElement.style.setProperty('--sidebar-hover-bg', settings.sidebarHoverBg);
        if (settings?.buttonBg) document.documentElement.style.setProperty('--button-bg', settings.buttonBg);
        if (settings?.buttonText) document.documentElement.style.setProperty('--button-text', settings.buttonText);
        if (settings?.headerBg) document.documentElement.style.setProperty('--header-bg', settings.headerBg);
        if (settings?.headerText) document.documentElement.style.setProperty('--header-text', settings.headerText);
        if (settings?.authCardBg) document.documentElement.style.setProperty('--auth-card-bg', settings.authCardBg);
        // If authCardBg is not set, prefer cardBg so auth pages follow generic card background
        if (!settings?.authCardBg && settings?.cardBg) document.documentElement.style.setProperty('--auth-card-bg', settings.cardBg);
        if (settings?.cardBg) document.documentElement.style.setProperty('--card-bg', settings.cardBg);
        // auth backdrop (page background behind auth card)
        if (settings?.authBackdropBg) {
          document.documentElement.style.setProperty('--auth-backdrop-bg', settings.authBackdropBg);
          try { console.debug('[Providers] applied --auth-backdrop-bg from settings:', settings.authBackdropBg); } catch (e) {}
        }
        if (!settings?.authBackdropBg && settings?.cardBg) {
          document.documentElement.style.setProperty('--auth-backdrop-bg', settings.cardBg);
          try { console.debug('[Providers] applied --auth-backdrop-bg from cardBg:', settings.cardBg); } catch (e) {}
        }

        // set fallback CSS vars if not set
        if (!getComputedStyle(document.documentElement).getPropertyValue('--primary-color')) document.documentElement.style.setProperty('--primary-color', '#2563eb');
        if (!getComputedStyle(document.documentElement).getPropertyValue('--accent-color')) document.documentElement.style.setProperty('--accent-color', '#7c3aed');
        if (!getComputedStyle(document.documentElement).getPropertyValue('--sidebar-bg')) document.documentElement.style.setProperty('--sidebar-bg', '#0f1724');
        if (!getComputedStyle(document.documentElement).getPropertyValue('--sidebar-text')) document.documentElement.style.setProperty('--sidebar-text', '#e6eef8');
        if (!getComputedStyle(document.documentElement).getPropertyValue('--sidebar-active-bg')) document.documentElement.style.setProperty('--sidebar-active-bg', '#2563eb');
        if (!getComputedStyle(document.documentElement).getPropertyValue('--sidebar-hover-bg')) document.documentElement.style.setProperty('--sidebar-hover-bg', '#0b1220');
        if (!getComputedStyle(document.documentElement).getPropertyValue('--button-bg')) document.documentElement.style.setProperty('--button-bg', '#7c3aed');
        if (!getComputedStyle(document.documentElement).getPropertyValue('--button-text')) document.documentElement.style.setProperty('--button-text', '#ffffff');
        if (!getComputedStyle(document.documentElement).getPropertyValue('--header-bg')) document.documentElement.style.setProperty('--header-bg', '#ffffff');
        if (!getComputedStyle(document.documentElement).getPropertyValue('--header-text')) document.documentElement.style.setProperty('--header-text', '#111827');
        if (!getComputedStyle(document.documentElement).getPropertyValue('--auth-card-bg')) document.documentElement.style.setProperty('--auth-card-bg', '#0b1220');
        if (!getComputedStyle(document.documentElement).getPropertyValue('--card-bg')) document.documentElement.style.setProperty('--card-bg', '#ffffff');
        // Ensure auth backdrop has a fallback so auth pages won't flash white
        if (!getComputedStyle(document.documentElement).getPropertyValue('--auth-backdrop-bg')) {
          const card = getComputedStyle(document.documentElement).getPropertyValue('--card-bg') || '#ffffff';
          document.documentElement.style.setProperty('--auth-backdrop-bg', card.trim() || '#ffffff');
        }
        try {
          const final = getComputedStyle(document.documentElement).getPropertyValue('--auth-backdrop-bg');
          console.debug('[Providers] final --auth-backdrop-bg after fallbacks:', final);
        } catch (e) {}
      } catch (err) {
        // ignore
      }
    })();
  }, []);

  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}
