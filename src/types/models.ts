/**
 * Core data models for SnapSync
 */

export interface Photo {
  id: string;
  uri: string; // local file path
  from: string; // member name who shared it
  fromColor: string; // member color
  ts: number; // timestamp
  sizeBytes: number;
  thumbnail?: string; // optional thumbnail URI
}

export interface Member {
  id: string; // unique peer ID
  name: string;
  color: string; // hex color for UI
  isHost: boolean;
  peerId: string; // WebRTC peer ID
}

export interface Room {
  id: string; // room ID
  name: string; // room display name
  code: string; // 4-char join code (e.g., "KP73")
  myName: string; // current user's name
  myId: string; // current user's device ID
  isHost: boolean;
  port: number; // WebSocket server port
  hostIP?: string; // host IP address (for guests)
}

export interface TransferProgress {
  photoId: string;
  sent: number; // chunks sent
  total: number; // total chunks
  peerId: string; // which peer
}

/**
 * WebRTC signaling messages
 */
export type SignalingMessage =
  | { type: 'peer-list'; peers: Member[] }
  | { type: 'member-join'; member: Member }
  | { type: 'member-leave'; peerId: string }
  | { type: 'offer'; from: string; to: string; sdp: string }
  | { type: 'answer'; from: string; to: string; sdp: string }
  | { type: 'ice-candidate'; from: string; to: string; candidate: any };

/**
 * DataChannel photo transfer messages
 */
export type PhotoMessage =
  | {
      type: 'photo-start';
      id: string;
      from: string;
      fromColor: string;
      ts: number;
      chunks: number;
      sizeBytes: number;
    }
  | {
      type: 'photo-chunk';
      id: string;
      index: number;
      data: string; // base64 chunk
    }
  | {
      type: 'photo-end';
      id: string;
    }
  | {
      type: 'photo-request';
      id: string;
    }
  | {
      type: 'photo-manifest';
      photos: Array<{ id: string; ts: number; sizeBytes: number }>;
    };

/**
 * mDNS service discovery
 */
export interface DiscoveredRoom {
  name: string;
  code: string;
  host: string; // host name
  ip: string; // IP address
  port: number;
}
