/**
 * MMKV persistent storage layer
 * Used for device ID, recent rooms, and user preferences
 */

// MMKV is a native module; in Expo Go / dev clients it might be unavailable.
// We fall back to an in-memory store to keep the app running.
let MMKVClass: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  MMKVClass = require('react-native-mmkv').MMKV;
} catch (e) {
  console.warn('[MMKV] Native module not available, using in-memory storage');
}

import { generateDeviceId } from '../utils/roomCode';
import { Room } from '../types/models';

// Lazy initialization for MMKV to avoid EventEmitter errors
let _storage: any | null = null;

// Lightweight memory store used when MMKV is unavailable (Expo Go, web, etc.)
const memoryStore = new Map<string, string | number | boolean>();

function getStorage(): any {
  if (_storage) return _storage;

  if (MMKVClass) {
    _storage = new MMKVClass({
      id: 'snapsync-storage',
      encryptionKey: 'snapsync-encryption-key-2026',
    });
    return _storage;
  }

  // Fallback: mimic the MMKV API with Map
  _storage = {
    getString: (key: string) => {
      const v = memoryStore.get(key);
      return typeof v === 'string' ? v : undefined;
    },
    set: (key: string, value: string | number | boolean) => {
      memoryStore.set(key, value);
    },
    delete: (key: string) => {
      memoryStore.delete(key);
    },
    clearAll: () => {
      memoryStore.clear();
    },
  };

  return _storage;
}

// Export getter for storage access
export const storage = {
  getString: (key: string) => getStorage().getString(key),
  set: (key: string, value: string | number | boolean) => getStorage().set(key, value),
  delete: (key: string) => getStorage().delete(key),
  clearAll: () => getStorage().clearAll(),
};

// Storage keys
const KEYS = {
  DEVICE_ID: 'device_id',
  RECENT_ROOMS: 'recent_rooms',
  USER_NAME: 'user_name',
  DOWNLOADED_PHOTOS: 'downloaded_photos',
};

/**
 * Get or create device ID
 */
export function getOrCreateDeviceId(): string {
  let deviceId = storage.getString(KEYS.DEVICE_ID);
  if (!deviceId) {
    deviceId = generateDeviceId();
    storage.set(KEYS.DEVICE_ID, deviceId);
  }
  return deviceId;
}

/**
 * Save user's preferred name
 */
export function saveUserName(name: string): void {
  storage.set(KEYS.USER_NAME, name);
}

/**
 * Get user's preferred name
 */
export function getUserName(): string | undefined {
  return storage.getString(KEYS.USER_NAME);
}

/**
 * Save a room to recent rooms list
 */
export function saveRecentRoom(room: Pick<Room, 'id' | 'name' | 'code'>): void {
  const recentRoomsJson = storage.getString(KEYS.RECENT_ROOMS);
  const recentRooms: Array<Pick<Room, 'id' | 'name' | 'code'>> = recentRoomsJson
    ? JSON.parse(recentRoomsJson)
    : [];
  
  // Remove duplicate if exists
  const filtered = recentRooms.filter((r) => r.id !== room.id);
  
  // Add to front
  filtered.unshift(room);
  
  // Keep only last 10
  const limited = filtered.slice(0, 10);
  
  storage.set(KEYS.RECENT_ROOMS, JSON.stringify(limited));
}

/**
 * Get recent rooms list
 */
export function getRecentRooms(): Array<Pick<Room, 'id' | 'name' | 'code'>> {
  const recentRoomsJson = storage.getString(KEYS.RECENT_ROOMS);
  return recentRoomsJson ? JSON.parse(recentRoomsJson) : [];
}

/**
 * Mark a photo as downloaded
 */
export function markPhotoAsDownloaded(photoId: string): void {
  const downloadedJson = storage.getString(KEYS.DOWNLOADED_PHOTOS);
  const downloaded: string[] = downloadedJson ? JSON.parse(downloadedJson) : [];
  
  if (!downloaded.includes(photoId)) {
    downloaded.push(photoId);
    storage.set(KEYS.DOWNLOADED_PHOTOS, JSON.stringify(downloaded));
  }
}

/**
 * Check if photo has been downloaded
 */
export function isPhotoDownloaded(photoId: string): boolean {
  const downloadedJson = storage.getString(KEYS.DOWNLOADED_PHOTOS);
  const downloaded: string[] = downloadedJson ? JSON.parse(downloadedJson) : [];
  return downloaded.includes(photoId);
}

/**
 * Clear all downloaded photos tracking
 */
export function clearDownloadedPhotos(): void {
  storage.delete(KEYS.DOWNLOADED_PHOTOS);
}

/**
 * Clear all storage (for debugging/testing)
 */
export function clearAllStorage(): void {
  storage.clearAll();
}
