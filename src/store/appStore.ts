/**
 * Zustand store for app state management
 * Handles active session state: current room, members, photos, transfers
 */

import { create } from 'zustand';
import { Photo, Member, Room, TransferProgress } from '../types/models';

interface AppState {
  // Current room state
  currentRoom: Room | null;
  members: Member[];
  photos: Photo[];
  transferProgress: Map<string, TransferProgress>; // photoId-peerId -> progress
  
  // Connection state
  isConnected: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
  
  // Actions - Room management
  setCurrentRoom: (room: Room) => void;
  leaveRoom: () => void;
  
  // Actions - Member management
  addMember: (member: Member) => void;
  removeMember: (peerId: string) => void;
  updateMember: (peerId: string, updates: Partial<Member>) => void;
  
  // Actions - Photo management
  addPhoto: (photo: Photo) => void;
  addPhotos: (photos: Photo[]) => void;
  removePhoto: (photoId: string) => void;
  
  // Actions - Transfer progress
  updateTransferProgress: (progress: TransferProgress) => void;
  clearTransferProgress: (photoId: string, peerId?: string) => void;
  
  // Actions - Connection status
  setConnectionStatus: (status: AppState['connectionStatus']) => void;
  setConnected: (connected: boolean) => void;
  
  // Selectors
  getMyPhotos: () => Photo[];
  getPhotosByMember: (memberName: string) => Photo[];
  getConnectedPeers: () => Member[];
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  currentRoom: null,
  members: [],
  photos: [],
  transferProgress: new Map(),
  isConnected: false,
  connectionStatus: 'disconnected',
  
  // Room management
  setCurrentRoom: (room) =>
    set({
      currentRoom: room,
      connectionStatus: 'connecting',
    }),
  
  leaveRoom: () =>
    set({
      currentRoom: null,
      members: [],
      photos: [],
      transferProgress: new Map(),
      isConnected: false,
      connectionStatus: 'disconnected',
    }),
  
  // Member management
  addMember: (member) =>
    set((state) => ({
      members: [...state.members.filter((m) => m.id !== member.id), member],
    })),
  
  removeMember: (peerId) =>
    set((state) => ({
      members: state.members.filter((m) => m.peerId !== peerId),
    })),
  
  updateMember: (peerId, updates) =>
    set((state) => ({
      members: state.members.map((m) =>
        m.peerId === peerId ? { ...m, ...updates } : m
      ),
    })),
  
  // Photo management
  addPhoto: (photo) =>
    set((state) => ({
      photos: [...state.photos.filter((p) => p.id !== photo.id), photo],
    })),
  
  addPhotos: (photos) =>
    set((state) => {
      const existingIds = new Set(state.photos.map((p) => p.id));
      const newPhotos = photos.filter((p) => !existingIds.has(p.id));
      return {
        photos: [...state.photos, ...newPhotos],
      };
    }),
  
  removePhoto: (photoId) =>
    set((state) => ({
      photos: state.photos.filter((p) => p.id !== photoId),
    })),
  
  // Transfer progress
  updateTransferProgress: (progress) =>
    set((state) => {
      const key = `${progress.photoId}-${progress.peerId}`;
      const newProgress = new Map(state.transferProgress);
      newProgress.set(key, progress);
      return { transferProgress: newProgress };
    }),
  
  clearTransferProgress: (photoId, peerId) =>
    set((state) => {
      const newProgress = new Map(state.transferProgress);
      if (peerId) {
        newProgress.delete(`${photoId}-${peerId}`);
      } else {
        // Clear all progress for this photo
        Array.from(newProgress.keys())
          .filter((key) => key.startsWith(photoId))
          .forEach((key) => newProgress.delete(key));
      }
      return { transferProgress: newProgress };
    }),
  
  // Connection status
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  
  setConnected: (connected) => set({ isConnected: connected }),
  
  // Selectors
  getMyPhotos: () => {
    const state = get();
    const myName = state.currentRoom?.myName;
    return state.photos.filter((p) => p.from === myName);
  },
  
  getPhotosByMember: (memberName) => {
    const state = get();
    return state.photos.filter((p) => p.from === memberName);
  },
  
  getConnectedPeers: () => {
    const state = get();
    return state.members.filter((m) => m.peerId !== '');
  },
}));
