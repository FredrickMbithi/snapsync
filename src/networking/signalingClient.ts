/**
 * WebSocket Signaling Client
 * Used by guest devices to connect to host's signaling server
 */

import type { SignalingMessage, Member } from '../types/models';

export type SignalingClientEvents = {
  onConnect: () => void;
  onDisconnect: () => void;
  onPeerList: (peers: Member[]) => void;
  onMemberJoin: (member: Member) => void;
  onMemberLeave: (peerId: string) => void;
  onOffer: (from: string, sdp: string) => void;
  onAnswer: (from: string, sdp: string) => void;
  onIceCandidate: (from: string, candidate: any) => void;
  onError: (error: Error) => void;
};

export class SignalingClient {
  private socket: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private shouldReconnect = true;
  private events: Partial<SignalingClientEvents> = {};

  constructor(host: string, port: number = 8888) {
    this.url = `ws://${host}:${port}`;
  }

  /**
   * Connect to signaling server
   */
  connect(member: Member): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`[SignalingClient] Connecting to ${this.url}`);
        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => {
          console.log('[SignalingClient] Connected');
          this.reconnectAttempts = 0;
          this.events.onConnect?.();
          
          // Send member-join message
          this.send({
            type: 'member-join',
            member,
          });
          
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const message: SignalingMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[SignalingClient] Failed to parse message:', error);
          }
        };

        this.socket.onerror = (error) => {
          console.error('[SignalingClient] Socket error:', error);
          this.events.onError?.(new Error('WebSocket error'));
          reject(error);
        };

        this.socket.onclose = () => {
          console.log('[SignalingClient] Disconnected');
          this.socket = null;
          this.events.onDisconnect?.();
          
          if (this.shouldReconnect) {
            this.attemptReconnect(member);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle incoming signaling messages
   */
  private handleMessage(message: SignalingMessage): void {
    console.log('[SignalingClient] Received message:', message.type);

    switch (message.type) {
      case 'peer-list':
        this.events.onPeerList?.(message.peers);
        break;

      case 'member-join':
        this.events.onMemberJoin?.(message.member);
        break;

      case 'member-leave':
        this.events.onMemberLeave?.(message.peerId);
        break;

      case 'offer':
        this.events.onOffer?.(message.from, message.sdp);
        break;

      case 'answer':
        this.events.onAnswer?.(message.from, message.sdp);
        break;

      case 'ice-candidate':
        this.events.onIceCandidate?.(message.from, message.candidate);
        break;

      default:
        console.warn('[SignalingClient] Unknown message type:', message);
    }
  }

  /**
   * Send WebRTC offer to peer
   */
  sendOffer(to: string, sdp: string): void {
    this.send({
      type: 'offer',
      from: '', // Server will fill this
      to,
      sdp,
    });
  }

  /**
   * Send WebRTC answer to peer
   */
  sendAnswer(to: string, sdp: string): void {
    this.send({
      type: 'answer',
      from: '', // Server will fill this
      to,
      sdp,
    });
  }

  /**
   * Send ICE candidate to peer
   */
  sendIceCandidate(to: string, candidate: any): void {
    this.send({
      type: 'ice-candidate',
      from: '', // Server will fill this
      to,
      candidate,
    });
  }

  /**
   * Send message to server
   */
  private send(message: any): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('[SignalingClient] Cannot send - socket not open');
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(member: Member): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[SignalingClient] Max reconnect attempts reached');
      this.events.onError?.(new Error('Failed to reconnect'));
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(`[SignalingClient] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect(member).catch((error) => {
        console.error('[SignalingClient] Reconnect failed:', error);
      });
    }, delay);
  }

  /**
   * Set event handlers
   */
  on<K extends keyof SignalingClientEvents>(
    event: K,
    handler: SignalingClientEvents[K]
  ): void {
    this.events[event] = handler;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    this.shouldReconnect = false;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
