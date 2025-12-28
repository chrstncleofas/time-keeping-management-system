import '@/styles/globals.css';
import Providers from './Providers';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import connectDB from '@/lib/db/mongodb';
import SystemSettings from '@/lib/models/SystemSettings';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'TKMS - Time Keeping Management System',
  description: 'A comprehensive time keeping management system with camera capture',
};

const SETTINGS_ID = '000000000000000000000001';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Server-side: fetch system settings so we can inject CSS variables on first paint
  let settings: any = null;
  try {
    await connectDB();
    settings = await SystemSettings.findById(SETTINGS_ID).lean();
  } catch (err) {
    // ignore and fallback to defaults
  }

  const vars = {
    '--primary-color': settings?.primaryColor || '#2563eb',
    '--accent-color': settings?.accentColor || '#7c3aed',
    '--sidebar-bg': settings?.sidebarBg || '#0f1724',
    '--sidebar-text': settings?.sidebarText || '#e6eef8',
    '--sidebar-active-bg': settings?.sidebarActiveBg || '#2563eb',
    '--sidebar-hover-bg': settings?.sidebarHoverBg || '#0b1220',
    '--button-bg': settings?.buttonBg || '#7c3aed',
    '--button-text': settings?.buttonText || '#ffffff',
    '--header-text': settings?.headerText || '#111827',
    // auth/login card background (separate from sidebar)
    '--auth-card-bg': settings?.authCardBg || settings?.cardBg || (settings?.sidebarBg ? darkenHex(settings.sidebarBg, 18) : '#0b1220'),
    '--auth-backdrop-bg': settings?.authBackdropBg || settings?.cardBg || settings?.headerBg || '#ffffff',
    // generic card background for forms and panels
    '--card-bg': settings?.cardBg || '#ffffff',
    // derived darker variants for hover/active states
    '--primary-color-dark': settings?.primaryColor ? darkenHex(settings.primaryColor, 12) : '#1e4bb8',
    '--accent-color-dark': settings?.accentColor ? darkenHex(settings.accentColor, 12) : '#5b2cc8',
    '--success-color': settings?.successColor || '#16a34a',
    '--success-color-dark': settings?.successColor ? darkenHex(settings.successColor, 12) : '#13803d',
    '--danger-color': settings?.dangerColor || '#dc2626',
    '--danger-color-dark': settings?.dangerColor ? darkenHex(settings.dangerColor, 12) : '#b91c1c',
  } as Record<string,string>;

  const cssVarsString = Object.entries(vars).map(([k,v]) => `${k}: ${v};`).join('\n');

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content={vars['--primary-color']} />
      </head>
      <body className={inter.className}>
        {/* Inject server-rendered CSS variables to preserve brand on first paint */}
        <style dangerouslySetInnerHTML={{ __html: `:root { ${cssVarsString} }` }} />
        <Providers>
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}

// Utility: darken a hex color by percent (server-side)
function darkenHex(hex: string, percent: number) {
  try {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const num = parseInt(h, 16);
    const r = Math.max(0, ((num >> 16) & 0xFF) - Math.round(255 * (percent / 100)));
    const g = Math.max(0, ((num >> 8) & 0xFF) - Math.round(255 * (percent / 100)));
    const b = Math.max(0, (num & 0xFF) - Math.round(255 * (percent / 100)));
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
  } catch (e) {
    return hex;
  }
}
