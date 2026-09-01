/**
 * Centralized Design Tokens for EcoCampus AI
 * Source of truth for branding, typography, spacing, and status semantics.
 */

export const DESIGN_TOKENS = {
  colors: {
    brand: {
      primary: "#0B6B4F", // Deep Forest Green
      dark: "#064E3B",    // Primary Dark Green
      light: "#EAF4F0",   // Soft Forest Tint
      accent: "#0E8362",
    },
    neutral: {
      background: "#F8FAF9", // Application background
      surface: "#FFFFFF",    // Cards, Modals, Panels
      surfaceHover: "#F3F6F5",
      border: "#E5E7EB",     // Subtle divider border
      borderDark: "#D1D5DB",
      textPrimary: "#111827",
      textSecondary: "#4B5563",
      textMuted: "#6B7280",
    },
    semantic: {
      normal: {
        text: "#065F46",
        bg: "#ECFDF5",
        border: "#A7F3D0",
        solid: "#10B981",
      },
      warning: {
        text: "#92400E",
        bg: "#FFFBEB",
        border: "#FDE68A",
        solid: "#F59E0B",
      },
      critical: {
        text: "#991B1B",
        bg: "#FEF2F2",
        border: "#FCA5A5",
        solid: "#EF4444",
      },
      info: {
        text: "#1E40AF",
        bg: "#EFF6FF",
        border: "#BFDBFE",
        solid: "#3B82F6",
      },
      offline: {
        text: "#374151",
        bg: "#F3F4F6",
        border: "#E5E7EB",
        solid: "#9CA3AF",
      },
    },
  },
  typography: {
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    sizes: {
      pageTitle: "text-2xl md:text-3xl font-semibold tracking-tight",
      sectionHeading: "text-lg md:text-xl font-semibold tracking-tight",
      kpiValue: "text-3xl font-bold tracking-tight",
      body: "text-sm md:text-base",
      secondary: "text-xs md:text-sm text-gray-500",
      caption: "text-xs text-gray-400 font-medium",
    },
  },
  radii: {
    sm: "rounded-md",   // 6px controls
    md: "rounded-lg",   // 8px inputs
    lg: "rounded-xl",   // 12px cards
    xl: "rounded-2xl",  // 16px panels
  },
  shadows: {
    subtle: "shadow-sm border border-gray-200/80",
    card: "shadow-xs border border-gray-200",
    modal: "shadow-xl border border-gray-200",
  },
  transitions: {
    default: "transition-all duration-200 ease-in-out",
    fast: "transition-all duration-150 ease-in-out",
  },
};
