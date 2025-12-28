'use client';

import { toast } from '@/lib/toast';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';
import { formatDateTime } from '@/lib/utils/helpers';

interface SystemSettings {
  enableLeaveCreditsManagement: boolean;
  enableFileLeaveRequest: boolean;
  enableVerbalAgreements: boolean;
  allowEarlyOut: boolean;
  allowHalfDay: boolean;
  allowLateIn: boolean;
  lastUpdatedAt: string;
  companyName?: string;
  logoUrl?: string;
  faviconUrl?: string;
  footerText?: string;
  primaryColor?: string;
  accentColor?: string;
  sidebarBg?: string;
  sidebarText?: string;
  sidebarActiveBg?: string;
  sidebarHoverBg?: string;
  buttonBg?: string;
  buttonText?: string;
  headerBg?: string;
  headerText?: string;
  authCardBg?: string;
  authBackdropBg?: string;
  cardBg?: string;
  employeeIdPrefix?: string;
}

interface ToggleSwitchProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await apiClient.getSystemSettings();
      setSettings(data);
      applyCssVars(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  const applyCssVars = (s: any) => {
    try {
      if (!s) return;
      if (s.primaryColor) document.documentElement.style.setProperty('--primary-color', s.primaryColor);
      if (s.accentColor) document.documentElement.style.setProperty('--accent-color', s.accentColor);
      if (s.sidebarBg) document.documentElement.style.setProperty('--sidebar-bg', s.sidebarBg);
      if (s.sidebarText) document.documentElement.style.setProperty('--sidebar-text', s.sidebarText);
      if (s.sidebarActiveBg) document.documentElement.style.setProperty('--sidebar-active-bg', s.sidebarActiveBg);
      if (s.sidebarHoverBg) document.documentElement.style.setProperty('--sidebar-hover-bg', s.sidebarHoverBg);
      if (s.buttonBg) document.documentElement.style.setProperty('--button-bg', s.buttonBg);
      if (s.buttonText) document.documentElement.style.setProperty('--button-text', s.buttonText);
      if (s.headerBg) document.documentElement.style.setProperty('--header-bg', s.headerBg);
      if (s.headerText) document.documentElement.style.setProperty('--header-text', s.headerText);
      if (s.authCardBg) document.documentElement.style.setProperty('--auth-card-bg', s.authCardBg);
      if (s.authBackdropBg) document.documentElement.style.setProperty('--auth-backdrop-bg', s.authBackdropBg);
      if (s.cardBg) document.documentElement.style.setProperty('--card-bg', s.cardBg);
    } catch (err) {
      // ignore
    }
  };

  const handleToggle = (field: keyof SystemSettings) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [field]: !settings[field as keyof SystemSettings],
    } as SystemSettings);
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      // Normalize color fields to a consistent 7-char hex before saving
      const normalizeColor = (c?: string) => {
        if (!c) return c;
        let v = String(c).trim().replace(/['\"]/g, '');
        if (!v) return v;
        if (!v.startsWith('#')) v = `#${v}`;
        // expand 3-char hex to 6-char
        if (v.length === 4) v = '#' + v.slice(1).split('').map(ch => ch + ch).join('');
        return v.toLowerCase();
      };

      const payload = {
        ...settings,
        primaryColor: normalizeColor(settings.primaryColor),
        accentColor: normalizeColor(settings.accentColor),
        sidebarBg: normalizeColor(settings.sidebarBg),
        sidebarText: normalizeColor(settings.sidebarText),
        sidebarActiveBg: normalizeColor(settings.sidebarActiveBg),
        sidebarHoverBg: normalizeColor(settings.sidebarHoverBg),
        buttonBg: normalizeColor(settings.buttonBg),
        buttonText: normalizeColor(settings.buttonText),
        headerBg: normalizeColor(settings.headerBg),
        headerText: normalizeColor(settings.headerText),
        authCardBg: normalizeColor(settings.authCardBg),
        authBackdropBg: normalizeColor(settings.authBackdropBg),
        cardBg: normalizeColor(settings.cardBg),
        // include footer text
        footerText: settings.footerText,
      } as any;

      const updated = await apiClient.updateSystemSettings(payload);
      // Debug: log payload and server response to console for troubleshooting
      try { console.debug('[Settings] save payload:', payload); console.debug('[Settings] server response:', updated); } catch (e) {}
      // Merge server response into local settings to avoid clearing fields the server might omit
      const merged = { ...(settings || {}), ...(updated || {}) } as any;
      setSettings(merged);
      applyCssVars(merged);
      toast.success('Settings updated successfully');
      // NOTE: we intentionally do NOT re-fetch here to avoid overwriting local state
      // await fetchSettings();
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">Failed to load settings</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-1">Configure system-wide features and branding (Super Admin only)</p>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 px-5 py-2 rounded-lg disabled:opacity-50">
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Main settings form */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6 space-y-6">
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Company Name</label>
              <input value={settings.companyName || ''} onChange={e => setSettings({ ...settings, companyName: e.target.value })} className="mt-2 p-2 border rounded w-full" />

              <label className="block text-sm font-medium text-gray-700 mt-4">Footer Text</label>
              <input value={settings.footerText || ''} onChange={e => setSettings({ ...settings, footerText: e.target.value })} placeholder="e.g. © {year} {company}. All rights reserved." className="mt-2 p-2 border rounded w-full" />
              <p className="text-xs text-gray-500 mt-1">You can use <span className="font-mono">{'{year}'}</span> and <span className="font-mono">{'{company}'}</span> tokens which will be replaced on the login page.</p>

              <label className="block text-sm font-medium text-gray-700 mt-4">Logo</label>
              <input type="file" accept="image/*" onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const reader = new FileReader();
                reader.onload = async () => {
                  const data = reader.result as string;
                  try {
                  const headers: any = { 'Content-Type': 'application/json' };
                  if (token) headers['Authorization'] = `Bearer ${token}`;
                  const res = await fetch('/api/uploads', { method: 'POST', headers, body: JSON.stringify({ filename: f.name, data }) });
                    const json = await res.json();
                    if (!res.ok) throw new Error(json.error || 'Upload failed');
                    setSettings({ ...settings, logoUrl: json.url });
                    toast.success('Logo uploaded');
                  } catch (err: any) { toast.error(err.message || 'Upload failed'); }
                };
                reader.readAsDataURL(f);
              }} className="mt-2" />
              {settings.logoUrl && <img src={settings.logoUrl} alt="logo" className="h-16 mt-3 rounded" />}

              <label className="block text-sm font-medium text-gray-700 mt-4">Favicon</label>
              <input type="file" accept="image/*" onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const reader = new FileReader();
                reader.onload = async () => {
                  const data = reader.result as string;
                  try {
                  const headers: any = { 'Content-Type': 'application/json' };
                  if (token) headers['Authorization'] = `Bearer ${token}`;
                  const res = await fetch('/api/uploads', { method: 'POST', headers, body: JSON.stringify({ filename: f.name, data }) });
                    const json = await res.json();
                    if (!res.ok) throw new Error(json.error || 'Upload failed');
                    setSettings({ ...settings, faviconUrl: json.url });
                    toast.success('Favicon uploaded');
                  } catch (err: any) { toast.error(err.message || 'Upload failed'); }
                };
                reader.readAsDataURL(f);
              }} className="mt-2" />
              {settings.faviconUrl && <img src={settings.faviconUrl} alt="favicon" className="h-8 mt-3 rounded" />}
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-800">Employee ID</h3>
              <label className="block text-sm text-gray-600 mt-3">Employee ID Prefix</label>
              <input value={settings.employeeIdPrefix || ''} onChange={e => setSettings({ ...settings, employeeIdPrefix: e.target.value })} className="mt-2 p-2 border rounded w-full" />

              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-800">Card Defaults</h3>
                <label className="block text-sm text-gray-600 mt-3">Auth Card Background</label>
                <input type="color" value={settings.authCardBg || ''} onChange={e => setSettings({ ...settings, authCardBg: e.target.value })} className="mt-2 p-1 rounded" />

                <label className="block text-sm text-gray-600 mt-3">Card Background</label>
                <input type="color" value={settings.cardBg || '#ffffff'} onChange={e => setSettings({ ...settings, cardBg: e.target.value })} className="mt-2 p-1 rounded" />
              </div>
            </div>
          </section>

          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Leave Management</h2>
            <div className="space-y-4">
              <ToggleSwitch label="Enable Leave Credits Management" description="Allow admins to add/deduct leave credits for employees" checked={settings.enableLeaveCreditsManagement} onChange={() => handleToggle('enableLeaveCreditsManagement')} />
              <ToggleSwitch label="Enable File Leave Request" description="Allow employees to file leave requests through the system" checked={settings.enableFileLeaveRequest} onChange={() => handleToggle('enableFileLeaveRequest')} />
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Time Adjustments</h2>
            <div className="space-y-4">
              <ToggleSwitch label="Enable Verbal Agreements" description="Allow manual time adjustments based on verbal agreements" checked={settings.enableVerbalAgreements} onChange={() => handleToggle('enableVerbalAgreements')} />
              <ToggleSwitch label="Allow Early Out" description="Permit employees to leave earlier than scheduled with approval" checked={settings.allowEarlyOut} onChange={() => handleToggle('allowEarlyOut')} />
              <ToggleSwitch label="Allow Half Day" description="Enable half-day work arrangements" checked={settings.allowHalfDay} onChange={() => handleToggle('allowHalfDay')} />
              <ToggleSwitch label="Allow Late In" description="Permit late clock-in with proper justification" checked={settings.allowLateIn} onChange={() => handleToggle('allowLateIn')} />
            </div>
          </div>

          <div className="text-sm text-gray-500">Last updated: {settings.lastUpdatedAt ? formatDateTime(settings.lastUpdatedAt) : '—'}</div>
        </div>

        {/* Right: Branding / color quick-edit panel */}
        <aside className="bg-white rounded-lg shadow p-6 space-y-6">
          <h3 className="text-lg font-semibold">Branding</h3>

          <div className="space-y-4">
            {[
              { label: 'Primary Color', key: 'primaryColor', default: '#2563eb' },
              { label: 'Accent Color', key: 'accentColor', default: '#7c3aed' },
              { label: 'Sidebar Background', key: 'sidebarBg', default: '#0f1724' },
              { label: 'Sidebar Text', key: 'sidebarText', default: '#e6eef8' },
              { label: 'Sidebar Active', key: 'sidebarActiveBg', default: '#2563eb' },
              { label: 'Sidebar Hover', key: 'sidebarHoverBg', default: '#0b1220' },
              { label: 'Button Background', key: 'buttonBg', default: '#7c3aed' },
              { label: 'Button Text', key: 'buttonText', default: '#ffffff' },
              { label: 'Auth Backdrop', key: 'authBackdropBg', default: '#ffffff' },
            ].map((c) => (
              <div key={c.key} className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-gray-700">{c.label}</div>
                  <div className="text-xs text-gray-500">{(settings as any)[c.key]}</div>
                </div>
                <div className="flex items-center gap-3">
                  <input type="color" value={(settings as any)[c.key] || c.default} onChange={e => setSettings({ ...settings, [c.key]: e.target.value })} className="p-1 rounded" />
                  <div className="w-8 h-8 rounded border" style={{ backgroundColor: (settings as any)[c.key] || c.default }} />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t">
            <div className="text-sm text-gray-600 mb-2">Preview</div>
            <div className="rounded p-4" style={{ backgroundColor: settings.authBackdropBg || settings.cardBg || '#ffffff' }}>
              <div className="max-w-xs mx-auto rounded-lg p-4" style={{ backgroundColor: settings.authCardBg || settings.cardBg || '#0b1220' }}>
                <div className="h-6 w-32 mb-3" style={{ background: `linear-gradient(90deg, ${settings.primaryColor || '#2563eb'} 0%, ${settings.accentColor || '#7c3aed'} 100%)` }} />
                <div className="h-8 w-full rounded" style={{ backgroundColor: settings.buttonBg || '#7c3aed' }} />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <button onClick={handleSave} disabled={saving} className="w-full btn-primary px-4 py-2 rounded">
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ToggleSwitch({ 
  label,
  description,
  checked,
  onChange 
}: ToggleSwitchProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <h3 className="text-base font-medium text-gray-900">{label}</h3>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
      <button type="button" onClick={onChange} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}>
        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}
