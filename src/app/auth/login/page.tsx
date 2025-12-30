'use client';

import Image from 'next/image';
import { toast } from '@/lib/toast';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';
import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useSystemSettings } from '@/hooks/useSystemSettings';

export default function LoginPage() {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated, login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { settings } = useSystemSettings();

  const [computedVars, setComputedVars] = useState({ primary: '#2563eb', accent: '#7c3aed', sidebarBg: '#0f1724', sidebarText: '#e6eef8', buttonText: '#ffffff', cardBg: '#ffffff', authCardBg: '#0b1220', authBackdrop: '#ffffff' });

  const primaryColor = settings?.primaryColor || computedVars.primary;
  const accentColor = settings?.accentColor || computedVars.accent;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const cs = getComputedStyle(document.documentElement);
      setComputedVars({
        primary: cs.getPropertyValue('--primary-color')?.trim() || '#2563eb',
        accent: cs.getPropertyValue('--accent-color')?.trim() || '#7c3aed',
        sidebarBg: cs.getPropertyValue('--sidebar-bg')?.trim() || '#0f1724',
        sidebarText: cs.getPropertyValue('--sidebar-text')?.trim() || '#e6eef8',
        buttonText: cs.getPropertyValue('--button-text')?.trim() || '#ffffff',
        cardBg: cs.getPropertyValue('--card-bg')?.trim() || '#ffffff',
        authCardBg: cs.getPropertyValue('--auth-card-bg')?.trim() || '#0b1220',
        authBackdrop: cs.getPropertyValue('--auth-backdrop-bg')?.trim() || '#ffffff',
      });
    } catch (e) {
      // ignore
    }
  }, [settings]);

  const hexToRgba = (hex: string, alpha = 1) => {
    try {
      const h = hex.replace('#', '');
      const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } catch (e) {
      return hex;
    }
  };

  const parseHex = (hex: string) => {
    if (!hex) return null;
    try {
      const h = hex.replace(/\s/g, '').replace('"', '').replace("'", '');
      const clean = h.startsWith('#') ? (h.length === 4 ? h.split('').map(c => c + c).join('') : h) : h;
      const parsed = clean.startsWith('#') ? clean : null;
      if (!parsed) return null;
      const bigint = parseInt(parsed.replace('#', ''), 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return { r, g, b };
    } catch (e) {
      return null;
    }
  };

  const isLightColor = (hex: string) => {
    const p = parseHex(hex);
    if (!p) return false;
    const brightness = (p.r * 299 + p.g * 587 + p.b * 114) / 1000;
    return brightness > 150;
  };

  const effectiveCardBg = settings?.authCardBg || settings?.cardBg || computedVars.authCardBg || computedVars.cardBg || 'var(--auth-card-bg)';
  const useLightBg = typeof effectiveCardBg === 'string' && isLightColor(effectiveCardBg);
  const headingColor = useLightBg ? '#0f1724' : '#ffffff';
  const labelColor = useLightBg ? '#374151' : '#d1d5db';
  const inputBg = useLightBg ? hexToRgba(settings?.cardBg || computedVars.cardBg || '#ffffff', 0.98) : hexToRgba(settings?.sidebarBg || computedVars.sidebarBg, 0.6);
  const inputText = useLightBg ? '#111827' : (settings?.sidebarText || computedVars.sidebarText);
  const inputBorder = useLightBg ? '1px solid rgba(15,23,36,0.06)' : '1px solid rgba(255,255,255,0.06)';
  const effectiveBackdrop = settings?.authBackdropBg || settings?.cardBg || computedVars.authBackdrop || computedVars.cardBg || 'var(--auth-backdrop-bg)';
  // Redirect if already logged in
  useEffect(() => {
    if (!isHydrated) return; // Wait for hydration
    
    if (isAuthenticated && user) {
      // Redirect based on role
      if (user.role === 'admin' || user.role === 'super-admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/employee/dashboard');
      }
    }
  }, [isAuthenticated, user, isHydrated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiClient.login(email, password);
      
      if (response.success) {
        login(response.user, response.token);
        toast.success('Login successful!');
        
        // Redirect based on role
        if (response.user.role === 'admin' || response.user.role === 'super-admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/employee/dashboard');
        }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while hydrating
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-dark-gradient flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12" style={{ borderBottomColor: primaryColor }}></div>
      </div>
    );
  }

  // Don't render login form if already authenticated (will redirect)
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark-gradient flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-gradient flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundColor: effectiveBackdrop }}>
      {/* Animated background circles */}
      <div className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl animate-pulse-slow" style={{ backgroundColor: hexToRgba(primaryColor, 0.08) }}></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl animate-pulse-slow" style={{ backgroundColor: hexToRgba(accentColor, 0.08) }}></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Image 
              src={settings?.companyName ? (settings?.logoUrl || process.env.NEXT_PUBLIC_APP_LOGO || "/ibaytech-logo.png") : (process.env.NEXT_PUBLIC_APP_LOGO || "/ibaytech-logo.png")} 
              alt={settings?.companyName || process.env.NEXT_PUBLIC_APP_NAME || "IBAYTECH CORP"} 
              width={240} 
              height={240}
              priority
              style={{ width: 'auto', height: 'auto', maxWidth: '240px' }}
              className="drop-shadow-2xl"
            />
          </div>
          <h2 className="text-2xl font-bold text-gradient mb-2">Time Keeping Management System</h2>
          <p className="text-gray-4/80 backdrop-blur-xl00">Sign in to continue</p>
        </div>

        {/* Login Form */}
        <div className="rounded-2xl shadow-2xl p-8" style={{ backgroundColor: settings?.authCardBg || settings?.cardBg || 'var(--auth-card-bg)', border: useLightBg ? '1px solid rgba(15,23,36,0.06)' : '1px solid rgba(255,255,255,0.04)' }}>
          <h2 className="text-2xl font-bold mb-6" style={{ color: headingColor }}>Welcome Back</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: labelColor }}>
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                     className="w-full pl-10 pr-4 py-3 rounded-lg placeholder-gray-500"
                     style={{ backgroundColor: inputBg, border: inputBorder, color: inputText }}
                  placeholder="your.email@ibaytech.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium" style={{ color: labelColor }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => router.push('/auth/forgot-password')}
                   className="text-sm"
                   style={{ color: primaryColor }}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                   className="w-full pl-10 pr-12 py-3 rounded-lg placeholder-gray-500"
                  style={{ backgroundColor: inputBg, border: inputBorder, color: inputText }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full font-semibold py-3 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              style={{ backgroundColor: accentColor, color: settings?.buttonText || computedVars.buttonText }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          {(() => {
            const tpl = settings?.footerText;
            if (!tpl) return `© ${new Date().getFullYear()} ${settings?.companyName || process.env.NEXT_PUBLIC_APP_NAME || 'IBAYTECH CORP'}. All rights reserved.`;
            try {
              return tpl.replace(/\{year\}/gi, String(new Date().getFullYear())).replace(/\{company\}/gi, settings?.companyName || process.env.NEXT_PUBLIC_APP_NAME || 'IBAYTECH CORP');
            } catch (e) { return tpl; }
          })()}
        </p>
      </div>
    </div>
  );
}
