/**
 * Signaling Manager
 * Manages the WebSocket signaling client for React Native
 * Note: The signaling server must run separately as a Node.js process
 */

import { SignalingClient } from './signalingClient';

class SignalingManager {
  private static clientInstance: SignalingClient | null = null;

  /**
   * Note: Server cannot run in React Native (ws package requires Node.js)
   * Run the server separately: node server/signalingServer.js
   */
  static getServer(_port: number = 8888): never {
    throw new Error(
      'SignalingServer cannot run in React Native. ' +
      'Run the server separately as a Node.js process: node server/signalingServer.js'
    );
  }

  /**
   * Server cannot run in React Native
   */
  static async stopServer(): Promise<void> {
    console.warn('SignalingServer is not running in React Native');
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
   * Server cannot run in React Native
   */
  static isServerRunning(): boolean {
    return false;
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
    this.disconnectClient();
  }
}

export default SignalingManager;
