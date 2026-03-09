/**
 * TCP Message Framing Utilities
 * 
 * TCP is a stream protocol - it doesn't preserve message boundaries.
 * We use length-prefixed framing: 4-byte big-endian length header + JSON payload
 * 
 * Format: [4 bytes: length][N bytes: JSON message]
 */

import type { SignalingMessage } from '../types/models';

/**
 * Encode a message for TCP transmission
 * Returns a Buffer with 4-byte length prefix + JSON payload
 */
export function encodeMessage(message: SignalingMessage): Buffer {
  const json = JSON.stringify(message);
  const payload = Buffer.from(json, 'utf-8');
  const header = Buffer.alloc(4);
  header.writeUInt32BE(payload.length, 0);
  return Buffer.concat([header, payload]);
}

/**
 * Message parser that handles TCP stream buffering
 * Call feed() with incoming data chunks, it will emit complete messages via callback
 */
export function createMessageParser(
  onMessage: (message: SignalingMessage) => void,
  onError?: (error: Error) => void
): { feed: (chunk: Buffer) => void; reset: () => void } {
  let buffer = Buffer.alloc(0);

  return {
    feed(chunk: Buffer): void {
      // Append new data to buffer
      buffer = Buffer.concat([buffer, chunk]);

      // Process all complete messages in buffer
      while (buffer.length >= 4) {
        const messageLength = buffer.readUInt32BE(0);

        // Sanity check: reject absurdly large messages (>10MB)
        if (messageLength > 10 * 1024 * 1024) {
          onError?.(new Error(`Message too large: ${messageLength} bytes`));
          buffer = Buffer.alloc(0); // Reset buffer on error
          return;
        }

        // Wait for complete message
        if (buffer.length < 4 + messageLength) {
          break;
        }

        // Extract and parse message
        const messageData = buffer.slice(4, 4 + messageLength);
        buffer = buffer.slice(4 + messageLength);

        try {
          const json = messageData.toString('utf-8');
          const message = JSON.parse(json) as SignalingMessage;
          onMessage(message);
        } catch (error) {
          onError?.(new Error(`Failed to parse message: ${error}`));
        }
      }
    },

    reset(): void {
      buffer = Buffer.alloc(0);
    },
  };
}
