/**
 * Room code generation and QR data formatting
 */

/**
 * Generate a unique 4-character alphanumeric room code
 * Format: XXNN (e.g., KP73, AB42)
 */
export function generateRoomCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // excluding I, O for clarity
  const numbers = '0123456789';
  
  const letter1 = letters[Math.floor(Math.random() * letters.length)];
  const letter2 = letters[Math.floor(Math.random() * letters.length)];
  const number1 = numbers[Math.floor(Math.random() * numbers.length)];
  const number2 = numbers[Math.floor(Math.random() * numbers.length)];
  
  return `${letter1}${letter2}${number1}${number2}`;
}

/**
 * Format room data for QR code
 */
export function formatQRData(params: {
  code: string;
  host: string;
  port: number;
  name: string;
}): string {
  const { code, host, port, name } = params;
  return `snapsync://join?code=${code}&host=${host}&port=${port}&name=${encodeURIComponent(name)}`;
}

/**
 * Parse QR code data to room parameters
 */
export function parseQRData(qrData: string): {
  code: string;
  host: string;
  port: number;
  name: string;
} | null {
  try {
    const url = new URL(qrData);
    if (url.protocol !== 'snapsync:' || url.hostname !== 'join') {
      return null;
    }
    
    const code = url.searchParams.get('code');
    const host = url.searchParams.get('host');
    const port = url.searchParams.get('port');
    const name = url.searchParams.get('name');
    
    if (!code || !host || !port || !name) {
      return null;
    }
    
    return {
      code,
      host,
      port: parseInt(port, 10),
      name: decodeURIComponent(name),
    };
  } catch (error) {
    return null;
  }
}

/**
 * Generate a unique device ID
 */
export function generateDeviceId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
