/**
 * TCP Signaling Client
 * Used by guest devices to connect to host's TCP signaling server
 * Uses react-native-tcp-socket instead of WebSocket for React Native compatibility
 */

import TcpSocket from 'react-native-tcp-socket';
import type { Socket } from 'react-native-tcp-socket/lib/types/Socket';
import type { SignalingMessage, Member } from '../types/models';
import { encodeMessage, createMessageParser } from './tcpFraming';

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
  private socket: Socket | null = null;
  private host: string;
  private port: number;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private shouldReconnect = true;
  private events: Partial<SignalingClientEvents> = {};
  private parser: ReturnType<typeof createMessageParser> | null = null;
  private pendingMember: Member | null = null;
  private connected = false;

  constructor(host: string, port: number = 8888) {
    this.host = host;
    this.port = port;
  }

  /**
   * Connect to signaling server
   */
  connect(member: Member): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`[SignalingClient] Connecting to ${this.host}:${this.port}`);
        this.pendingMember = member;

        // Create message parser
        this.parser = createMessageParser(
          (message) => this.handleMessage(message),
          (error) => {
            console.error('[SignalingClient] Parse error:', error);
            this.events.onError?.(error);
          }
        );

        // Create TCP connection
        this.socket = TcpSocket.createConnection(
          { host: this.host, port: this.port },
          () => {
            console.log('[SignalingClient] Connected');
            this.connected = true;
            this.reconnectAttempts = 0;
            this.events.onConnect?.();

            // Send member-join message
            this.send({
              type: 'member-join',
              member,
            });

            resolve();
          }
        );

        this.socket.on('data', (data) => {
          this.parser?.feed(Buffer.from(data));
        });

        this.socket.on('error', (error) => {
          console.error('[SignalingClient] Socket error:', error);
          this.events.onError?.(new Error(`TCP socket error: ${error.message}`));
          if (!this.connected) {
            reject(error);
          }
        });

        this.socket.on('close', () => {
          console.log('[SignalingClient] Disconnected');
          this.connected = false;
          this.socket = null;
          this.parser?.reset();
          this.events.onDisconnect?.();

          if (this.shouldReconnect && this.pendingMember) {
            this.attemptReconnect(this.pendingMember);
          }
        });
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
  private send(message: SignalingMessage): void {
    if (this.socket && this.connected) {
      try {
        const encoded = encodeMessage(message);
        this.socket.write(encoded);
      } catch (error) {
        console.error('[SignalingClient] Failed to send:', error);
      }
    } else {
      console.warn('[SignalingClient] Cannot send - socket not connected');
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
    return this.connected;
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    this.shouldReconnect = false;
    this.pendingMember = null;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      try {
        this.socket.destroy();
      } catch (e) {
        // Ignore errors during cleanup
      }
      this.socket = null;
    }

    this.connected = false;
    this.parser?.reset();
  }
}
