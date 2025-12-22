import mongoose, { Schema, Model } from 'mongoose';

export interface ISystemSettings {
  _id: string;
  // Leave Management Settings
  enableLeaveCreditsManagement: boolean;
  enableFileLeaveRequest: boolean;
  
  // Time Adjustment Settings
  enableVerbalAgreements: boolean;
  allowEarlyOut: boolean;
  allowHalfDay: boolean;
  allowLateIn: boolean;
  
  // Controlled by
  lastUpdatedBy: mongoose.Types.ObjectId;
  lastUpdatedAt: Date;
  // Employee ID generation settings
  employeeIdPrefix?: string;
  employeeIdUppercase?: boolean;
  employeeIdPadding?: number;
  employeeIdDelimiter?: string;

  // Branding / Customization
  companyName: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  // Extended branding options
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
  footerText?: string;
}

const SystemSettingsSchema = new Schema<ISystemSettings>(
  {
    enableLeaveCreditsManagement: {
      type: Boolean,
      default: true,
      required: true,
    },
    enableFileLeaveRequest: {
      type: Boolean,
      default: true,
      required: true,
    },
    enableVerbalAgreements: {
      type: Boolean,
      default: true,
      required: true,
    },
    allowEarlyOut: {
      type: Boolean,
      default: true,
      required: true,
    },
    allowHalfDay: {
      type: Boolean,
      default: true,
      required: true,
    },
    allowLateIn: {
      type: Boolean,
      default: true,
      required: true,
    },
    // Employee ID generation settings
    employeeIdPrefix: {
      type: String,
        default: 'ibay',
      required: true,
    },
      // Branding / Customization
      companyName: {
        type: String,
        default: process.env.NEXT_PUBLIC_APP_NAME || 'IBAYTECH',
        required: true,
      },
      logoUrl: {
        type: String,
        default: process.env.NEXT_PUBLIC_APP_LOGO || '/ibaytech-logo.png',
      },
      faviconUrl: {
        type: String,
        default: process.env.NEXT_PUBLIC_APP_FAVICON || '/favicon.ico',
      },
      primaryColor: {
        type: String,
        default: process.env.NEXT_PUBLIC_PRIMARY_COLOR || '#2563eb',
      },
      accentColor: {
        type: String,
        default: process.env.NEXT_PUBLIC_ACCENT_COLOR || '#7c3aed',
      },
      // Extended branding options
      sidebarBg: {
        type: String,
        default: process.env.NEXT_PUBLIC_SIDEBAR_BG || '#0f1724',
      },
      sidebarText: {
        type: String,
        default: process.env.NEXT_PUBLIC_SIDEBAR_TEXT || '#e6eef8',
      },
      sidebarActiveBg: {
        type: String,
        default: process.env.NEXT_PUBLIC_SIDEBAR_ACTIVE_BG || '#2563eb',
      },
      sidebarHoverBg: {
        type: String,
        default: process.env.NEXT_PUBLIC_SIDEBAR_HOVER_BG || '#0b1220',
      },
      buttonBg: {
        type: String,
        default: process.env.NEXT_PUBLIC_BUTTON_BG || '#7c3aed',
      },
      buttonText: {
        type: String,
        default: process.env.NEXT_PUBLIC_BUTTON_TEXT || '#ffffff',
      },
      headerBg: {
        type: String,
        default: process.env.NEXT_PUBLIC_HEADER_BG || '#ffffff',
      },
      headerText: {
        type: String,
        default: process.env.NEXT_PUBLIC_HEADER_TEXT || '#111827',
      },
      authCardBg: {
        type: String,
        default: process.env.NEXT_PUBLIC_AUTH_CARD_BG || null,
      },
      authBackdropBg: {
        type: String,
        default: process.env.NEXT_PUBLIC_AUTH_BACKDROP_BG || '#ffffff',
      },
      cardBg: {
        type: String,
        default: process.env.NEXT_PUBLIC_CARD_BG || '#ffffff',
      },
      footerText: {
        type: String,
        default: process.env.NEXT_PUBLIC_FOOTER_TEXT || null,
      },
    employeeIdUppercase: {
      type: Boolean,
      default: false,
      required: true,
    },
    employeeIdPadding: {
      type: Number,
      default: 4,
      required: true,
    },
    employeeIdDelimiter: {
      type: String,
      default: '-',
      required: true,
    },
    lastUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one settings document exists
SystemSettingsSchema.index({ _id: 1 }, { unique: true });

const SystemSettings: Model<ISystemSettings> =
  mongoose.models.SystemSettings || mongoose.model<ISystemSettings>('SystemSettings', SystemSettingsSchema);

export default SystemSettings;
