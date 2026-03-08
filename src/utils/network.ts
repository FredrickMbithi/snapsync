/**
 * Network utilities for getting device IP address
 */

// Dynamically import netinfo if available
let NetInfo: any = null;
try {
  NetInfo = require('@react-native-community/netinfo');
} catch (e) {
  console.log('[Network] NetInfo not available, using manual IP entry');
}

/**
 * Get the device's local IP address
 * Uses @react-native-community/netinfo when available
 */
export async function getLocalIPAddress(): Promise<string | null> {
  try {
    if (NetInfo) {
      const state = await NetInfo.fetch();
      if (state.details && 'ipAddress' in state.details) {
        const ip = (state.details as any).ipAddress;
        if (ip && isValidIPAddress(ip)) {
          return ip;
        }
      }
    }
    // Return null if we can't detect IP
    // This signals to the UI to request manual entry
    return null;
  } catch (error) {
    console.error('Failed to get local IP:', error);
    return null;
  }
}

/**
 * Validate IP address format
 */
export function isValidIPAddress(ip: string): boolean {
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipRegex.test(ip)) {
    return false;
  }
  
  const parts = ip.split('.');
  return parts.every((part) => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255;
  });
}

/**
 * Format IP address for display
 */
export function formatIPAddress(ip: string): string {
  if (!ip) return 'Unknown';
  return ip;
}
