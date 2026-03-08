/**
 * WebSocket Signaling Server
 * Runs as a standalone Node.js process to coordinate WebRTC peer connections
 * 
 * Usage: npx ts-node server/signalingServer.ts [port]
 */

import WebSocket, { WebSocketServer } from 'ws';
import type { SignalingMessage, Member } from './types';

export interface ClientInfo {
  id: string;
  socket: WebSocket;
  member?: Member;
}

export class SignalingServer {
  private server: WebSocketServer | null = null;
  private clients: Map<string, ClientInfo> = new Map();
  private port: number;
  
  constructor(port: number = 8888) {
    this.port = port;
  }

  /**
   * Start the WebSocket server
   */
  start(onClientUpdate?: (clients: ClientInfo[]) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = new WebSocketServer({ port: this.port });
        
        this.server.on('listening', () => {
          console.log(`[SignalingServer] Listening on port ${this.port}`);
          resolve();
        });
        
        this.server.on('error', (error) => {
          console.error('[SignalingServer] Server error:', error);
          reject(error);
        });
        
        this.server.on('connection', (socket: WebSocket) => {
          const clientId = this.generateClientId();
          console.log(`[SignalingServer] New connection: ${clientId}`);
          
          this.clients.set(clientId, { id: clientId, socket });
          
          // Send welcome message with client ID
          this.send(socket, {
            type: 'peer-list',
            peers: Array.from(this.clients.values())
              .filter(c => c.member)
              .map(c => c.member!),
          });
          
          socket.on('message', (data: Buffer) => {
            try {
              const message: SignalingMessage = JSON.parse(data.toString());
              this.handleMessage(clientId, message, socket);
            } catch (error) {
              console.error('[SignalingServer] Failed to parse message:', error);
            }
          });
          
          socket.on('close', () => {
            console.log(`[SignalingServer] Client disconnected: ${clientId}`);
            const client = this.clients.get(clientId);
            this.clients.delete(clientId);
            
            // Notify others about member leaving
            if (client?.member) {
              this.broadcast({
                type: 'member-leave',
                peerId: clientId,
              });
            }
            
            onClientUpdate?.(Array.from(this.clients.values()));
          });
          
          socket.on('error', (error) => {
            console.error(`[SignalingServer] Socket error for ${clientId}:`, error);
          });
          
          onClientUpdate?.(Array.from(this.clients.values()));
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle incoming signaling messages
   */
  private handleMessage(
    fromId: string,
    message: SignalingMessage,
    socket: WebSocket
  ): void {
    console.log(`[SignalingServer] Message from ${fromId}:`, message.type);
    
    switch (message.type) {
      case 'member-join':
        // Store member info
        const client = this.clients.get(fromId);
        if (client) {
          client.member = message.member;
          client.member.peerId = fromId; // Ensure peer ID matches
        }
        
        // Broadcast to all other clients
        this.broadcast(
          {
            type: 'member-join',
            member: { ...message.member, peerId: fromId },
          },
          fromId
        );
        
        // Send current peer list to new member
        this.send(socket, {
          type: 'peer-list',
          peers: Array.from(this.clients.values())
            .filter(c => c.member && c.id !== fromId)
            .map(c => c.member!),
        });
        break;
        
      case 'offer':
      case 'answer':
      case 'ice-candidate':
        // Route to specific peer
        const targetClient = this.clients.get(message.to);
        if (targetClient) {
          this.send(targetClient.socket, {
            ...message,
            from: fromId,
          });
        } else {
          console.warn(`[SignalingServer] Target peer not found: ${message.to}`);
        }
        break;
        
      default:
        console.warn('[SignalingServer] Unknown message type:', message);
    }
  }

  /**
   * Send message to a specific client
   */
  private send(socket: WebSocket, message: any): void {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast message to all clients except sender
   */
  private broadcast(message: any, excludeId?: string): void {
    const payload = JSON.stringify(message);
    this.clients.forEach((client, id) => {
      if (id !== excludeId && client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(payload);
      }
    });
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `peer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
    return Array.from(this.clients.values())
      .filter(c => c.member)
      .map(c => c.member!);
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
        client.socket.close();
      });
      this.clients.clear();

      // Close server
      this.server.close(() => {
        console.log('[SignalingServer] Server stopped');
        this.server = null;
        resolve();
      });
    });
  }

  /**
   * Check if server is running
   */
  isRunning(): boolean {
    return this.server !== null;
  }
}

// Run as standalone server
if (require.main === module) {
  const port = parseInt(process.argv[2] || '8888', 10);
  const server = new SignalingServer(port);
  
  server.start(() => {
    console.log('[SignalingServer] Client list updated');
  }).then(() => {
    console.log(`[SignalingServer] Ready on port ${port}`);
    console.log('Press Ctrl+C to stop');
  }).catch((err) => {
    console.error('[SignalingServer] Failed to start:', err);
    process.exit(1);
  });

  process.on('SIGINT', async () => {
    console.log('\n[SignalingServer] Shutting down...');
    await server.stop();
    process.exit(0);
  });
}
