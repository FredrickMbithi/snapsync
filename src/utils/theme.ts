/**
 * SnapSync Theme - Dark mode with gold accents
 * Based on the HTML mockup design
 */

export const colors = {
  // Backgrounds
  bg: '#0e0c0a',
  surface1: '#161410',
  surface2: '#1e1b17',
  surface3: '#28251f',
  surfaceGlass: 'rgba(255,255,255,0.02)',
  
  // Borders
  border: '#2e2a24',
  border2: '#3d382f',
  borderGlow: 'rgba(240,180,41,0.35)',
  
  // Text
  text: '#f4efe8',
  text2: '#9a9186',
  text3: '#5a5448',
  
  // Accents
  gold: '#f0b429',
  gold2: '#e8973a',
  goldFade: 'rgba(240,180,41,0.12)',
  goldGlow: 'rgba(240,180,41,0.18)',
  teal: '#6be9c8',
  amber: '#ffce73',
  
  // Status
  red: '#ff4757',
  green: '#2ed573',
  
  // Transparent
  transparent: 'transparent',
};

export const fonts = {
  // For headers - use system bold as Bebas Neue alternative
  heading: {
    fontWeight: '900' as const,
    letterSpacing: 2,
  },
  // For body text
  body: {
    fontWeight: '400' as const,
  },
  // For labels - monospace style
  mono: {
    fontWeight: '500' as const,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 10,
  lg: 14,
  xl: 20,
  full: 99,
};

export const shadows = {
  soft: {
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 10,
  },
  glow: {
    shadowColor: colors.gold,
    shadowOpacity: 0.45,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 20,
    elevation: 14,
  },
};
