/**
 * Signaling Server Manager
 * Singleton to manage the WebSocket signaling server instance
 */

import { SignalingServer } from './signalingServer';
import { SignalingClient } from './signalingClient';

class SignalingManager {
  private static serverInstance: SignalingServer | null = null;
  private static clientInstance: SignalingClient | null = null;

  /**
   * Get or create server instance (for host)
   */
  static getServer(port: number = 8888): SignalingServer {
    if (!this.serverInstance) {
      this.serverInstance = new SignalingServer(port);
    }
    return this.serverInstance;
  }

  /**
   * Stop and clear server instance
   */
  static async stopServer(): Promise<void> {
    if (this.serverInstance) {
      await this.serverInstance.stop();
      this.serverInstance = null;
    }
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
    return this.serverInstance?.isRunning() ?? false;
  }

  /**
   * Check if client is connected
   */
  static isClientConnected(): boolean {
    return this.clientInstance?.isConnected() ?? false;
  }

  /**
   * Clean up all instances (call on app cleanup)
   */
  static async cleanup(): Promise<void> {
    await this.stopServer();
    this.disconnectClient();
  }
}

export default SignalingManager;
