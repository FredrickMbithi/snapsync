/**
 * TCP Signaling Server
 * 
 * Runs directly in React Native using react-native-tcp-socket.
 * The host device runs this server, guests connect as clients.
 * 
 * Protocol: Length-prefixed JSON messages (see tcpFraming.ts)
 */

import TcpSocket from 'react-native-tcp-socket';
import type Server from 'react-native-tcp-socket/lib/types/Server';
import type Socket from 'react-native-tcp-socket/lib/types/Socket';
import type { SignalingMessage, Member } from '../types/models';
import { encodeMessage, createMessageParser } from './tcpFraming';

interface ClientInfo {
  socket: Socket;
  peerId: string;
  member?: Member;
  parser: ReturnType<typeof createMessageParser>;
}

type ServerEvents = {
  onClientConnected: (peerId: string) => void;
  onClientDisconnected: (peerId: string) => void;
  onMemberJoin: (member: Member) => void;
  onError: (error: Error) => void;
};

class TcpSignalingServer {
  private server: Server | null = null;
  private clients: Map<string, ClientInfo> = new Map();
  private port: number = 0;
  private events: Partial<ServerEvents> = {};

  /**
   * Start the TCP server
   * @param port Port number (0 for auto-assign)
   * @returns Promise resolving to the actual port
   */
  start(port: number = 0): Promise<number> {
    return new Promise((resolve, reject) => {
      try {
        this.server = TcpSocket.createServer((socket: Socket) => {
          this.handleConnection(socket);
        });

        this.server.on('error', (error: Error) => {
          console.error('[TcpServer] Server error:', error);
          this.events.onError?.(error);
          reject(error);
        });

        this.server.listen({ port, host: '0.0.0.0' }, () => {
          const address = this.server?.address();
          this.port = typeof address === 'object' ? address?.port ?? port : port;
          console.log(`[TcpServer] Listening on port ${this.port}`);
          resolve(this.port);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle new client connection
   */
  private handleConnection(socket: Socket): void {
    const peerId = `peer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[TcpServer] Client connected: ${peerId}`);

    const parser = createMessageParser(
      (message) => this.handleMessage(peerId, message),
      (error) => console.error(`[TcpServer] Parse error from ${peerId}:`, error)
    );

    const clientInfo: ClientInfo = {
      socket,
      peerId,
      parser,
    };

    this.clients.set(peerId, clientInfo);
    this.events.onClientConnected?.(peerId);

    // Send peer list to new client
    this.sendPeerList(peerId);

    socket.on('data', (data: Buffer | string) => {
      parser.feed(Buffer.from(data));
    });

    socket.on('error', (error: Error) => {
      console.error(`[TcpServer] Client ${peerId} error:`, error);
    });

    socket.on('close', () => {
      console.log(`[TcpServer] Client disconnected: ${peerId}`);
      const client = this.clients.get(peerId);
      this.clients.delete(peerId);
      this.events.onClientDisconnected?.(peerId);

      // Broadcast member-leave
      if (client?.member) {
        this.broadcast(
          { type: 'member-leave', peerId },
          peerId
        );
      }
    });
  }

  /**
   * Handle incoming signaling message
   */
  private handleMessage(fromPeerId: string, message: SignalingMessage): void {
    console.log(`[TcpServer] Message from ${fromPeerId}:`, message.type);

    switch (message.type) {
      case 'member-join': {
        const client = this.clients.get(fromPeerId);
        if (client) {
          // Update member info with server-assigned peerId
          const member: Member = {
            ...message.member,
            peerId: fromPeerId,
          };
          client.member = member;
          this.events.onMemberJoin?.(member);

          // Broadcast to all other clients
          this.broadcast({ type: 'member-join', member }, fromPeerId);

          // Send updated peer list to new member
          this.sendPeerList(fromPeerId);
        }
        break;
      }

      case 'offer':
      case 'answer':
      case 'ice-candidate': {
        // Route to specific peer
        const targetPeerId = message.to;
        const targetClient = this.clients.get(targetPeerId);
        if (targetClient) {
          // Fill in the from field with actual peerId
          const routedMessage = {
            ...message,
            from: fromPeerId,
          };
          this.sendTo(targetPeerId, routedMessage as SignalingMessage);
        } else {
          console.warn(`[TcpServer] Target peer not found: ${targetPeerId}`);
        }
        break;
      }

      default:
        console.warn(`[TcpServer] Unknown message type:`, message);
    }
  }

  /**
   * Send peer list to a specific client
   */
  private sendPeerList(peerId: string): void {
    const peers: Member[] = [];
    this.clients.forEach((client) => {
      if (client.member) {
        peers.push(client.member);
      }
    });

    this.sendTo(peerId, { type: 'peer-list', peers });
  }

  /**
   * Send message to specific peer
   */
  sendTo(peerId: string, message: SignalingMessage): void {
    const client = this.clients.get(peerId);
    if (client) {
      try {
        const encoded = encodeMessage(message);
        client.socket.write(encoded);
      } catch (error) {
        console.error(`[TcpServer] Failed to send to ${peerId}:`, error);
      }
    }
  }

  /**
   * Broadcast message to all clients except sender
   */
  broadcast(message: SignalingMessage, excludePeerId?: string): void {
    this.clients.forEach((client, peerId) => {
      if (peerId !== excludePeerId) {
        this.sendTo(peerId, message);
      }
    });
  }

  /**
   * Get current port
   */
  getPort(): number {
    return this.port;
  }

  /**
   * Get connected client count
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Get all connected members
   */
  getMembers(): Member[] {
    const members: Member[] = [];
    this.clients.forEach((client) => {
      if (client.member) {
        members.push(client.member);
      }
    });
    return members;
  }

  /**
   * Set event handlers
   */
  on<K extends keyof ServerEvents>(event: K, handler: ServerEvents[K]): void {
    this.events[event] = handler;
  }

  /**
   * Check if server is running
   */
  isRunning(): boolean {
    return this.server !== null;
  }

  /**
   * Stop the server
   */
  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server) {
        resolve();
        return;
      }

      // Close all client connections
      this.clients.forEach((client) => {
        try {
          client.socket.destroy();
        } catch (e) {
          // Ignore errors during cleanup
        }
      });
      this.clients.clear();

      // Close server
      this.server.close(() => {
        console.log('[TcpServer] Server stopped');
        this.server = null;
        this.port = 0;
        resolve();
      });
    });
  }
}

// Export singleton instance
export const tcpSignalingServer = new TcpSignalingServer();
export default TcpSignalingServer;
