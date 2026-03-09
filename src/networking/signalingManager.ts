/**
 * Signaling Manager
 * Manages TCP signaling server and client for React Native
 * 
 * Host: Runs TcpSignalingServer in-app
 * Guest: Connects via SignalingClient (TCP)
 */

import { SignalingClient } from './signalingClient';
import { tcpSignalingServer } from './tcpSignalingServer';

class SignalingManager {
  private static clientInstance: SignalingClient | null = null;

  /**
   * Start TCP signaling server (for host)
   * @param port Optional port (0 for auto-assign)
   * @returns Promise resolving to actual port
   */
  static async startServer(port: number = 0): Promise<number> {
    if (tcpSignalingServer.isRunning()) {
      console.log('[SignalingManager] Server already running');
      return tcpSignalingServer.getPort();
    }
    
    const actualPort = await tcpSignalingServer.start(port);
    console.log(`[SignalingManager] Server started on port ${actualPort}`);
    return actualPort;
  }

  /**
   * Stop TCP signaling server
   */
  static async stopServer(): Promise<void> {
    if (tcpSignalingServer.isRunning()) {
      await tcpSignalingServer.stop();
      console.log('[SignalingManager] Server stopped');
    }
  }

  /**
   * Get TCP signaling server instance (for host)
   */
  static getServer() {
    return tcpSignalingServer;
  }

  /**
   * Get or create client instance (for guest)
   */
  static getClient(host: string, port: number = 8888): SignalingClient {
    if (!this.clientInstance) {
      this.clientInstance = new SignalingClient(host, port);
    }
    return this.clientInstance;
  }

  /**
   * Disconnect and clear client instance
   */
  static disconnectClient(): void {
    if (this.clientInstance) {
      this.clientInstance.disconnect();
      this.clientInstance = null;
    }
  }

  /**
   * Check if server is running
   */
  static isServerRunning(): boolean {
    return tcpSignalingServer.isRunning();
  }

  /**
   * Check if client is connected
   */
  static isClientConnected(): boolean {
    return this.clientInstance?.isConnected() ?? false;
  }

  /**
   * Get server port (if running)
   */
  static getServerPort(): number {
    return tcpSignalingServer.getPort();
  }

  /**
   * Clean up all instances (call on app cleanup)
   */
  static async cleanup(): Promise<void> {
    this.disconnectClient();
    await this.stopServer();
  }
}

export default SignalingManager;
