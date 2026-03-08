/**
 * Types for signaling server
 */

export interface Member {
  id: string;
  name: string;
  color: string;
  isHost: boolean;
  peerId: string;
}

export type SignalingMessage =
  | { type: 'peer-list'; peers: Member[] }
  | { type: 'member-join'; member: Member }
  | { type: 'member-leave'; peerId: string }
  | { type: 'offer'; from: string; to: string; sdp: string }
  | { type: 'answer'; from: string; to: string; sdp: string }
  | { type: 'ice-candidate'; from: string; to: string; candidate: any };
