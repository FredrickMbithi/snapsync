# Next Steps - Exact Commands

## Phase 2A: Install Additional Dependencies

```bash
cd /home/ghost/Dev/P-room/snapsync

# Install WebSocket library
yarn add ws
yarn add -D @types/ws

# Install QR Code generation
yarn add react-native-qrcode-svg react-native-svg

# Install Expo camera and dev client
npx expo install expo-camera expo-dev-client

# Install mDNS discovery (optional - can skip if network issues persist)
yarn add react-native-zeroconf

# Install WebRTC (Phase 3 - save for later)
# yarn add react-native-webrtc
# yarn add -D @config-plugins/react-native-webrtc

# Install MMKV storage
yarn add react-native-mmkv

# Install React Native dependencies for navigation
npx expo install react-native-screens react-native-safe-area-context
```

## Phase 2B: Create WebSocket Signaling Server

Create `src/networking/signalingServer.ts`:

```typescript
import { Server } from "ws";
import { SignalingMessage } from "../types/models";

export class SignalingServer {
  private server: Server | null = null;
  private clients: Map<string, any> = new Map();

  start(port: number) {
    this.server = new Server({ port });

    this.server.on("connection", (socket) => {
      const clientId = this.generateClientId();
      this.clients.set(clientId, socket);

      socket.on("message", (data) => {
        const message: SignalingMessage = JSON.parse(data.toString());
        this.handleMessage(clientId, message, socket);
      });

      socket.on("close", () => {
        this.clients.delete(clientId);
        this.broadcastPeerList();
      });
    });
  }

  private handleMessage(from: string, message: SignalingMessage, socket: any) {
    switch (message.type) {
      case "member-join":
        this.broadcastPeerList();
        break;
      case "offer":
      case "answer":
      case "ice-candidate":
        // Route to specific peer
        const targetSocket = this.clients.get(message.to);
        if (targetSocket) {
          targetSocket.send(JSON.stringify({ ...message, from }));
        }
        break;
    }
  }

  private broadcastPeerList() {
    const peers = Array.from(this.clients.keys());
    const message = { type: "peer-list", peers };
    this.broadcast(JSON.stringify(message));
  }

  private broadcast(data: string) {
    this.clients.forEach((socket) => {
      socket.send(data);
    });
  }

  private generateClientId(): string {
    return `peer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  stop() {
    this.server?.close();
    this.clients.clear();
  }
}
```

## Phase 2C: Integrate into CreateRoomScreen

Update `src/screens/CreateRoomScreen.tsx`:

```typescript
import { SignalingServer } from "../networking/signalingServer";

// ... inside component
const signalingServer = useRef<SignalingServer | null>(null);

const handleCreateRoom = async () => {
  // ... existing code ...

  // Start signaling server
  signalingServer.current = new SignalingServer();
  signalingServer.current.start(8888);

  // ... navigate to Room
};
```

## Phase 2D: Test Without Physical Device (Optional)

To test navigation without building for device:

```bash
# Start Expo in web mode (just to verify no compile errors)
npx expo start --web

# Or use iOS Simulator (limited - no WebRTC)
npx expo start --ios
```

## Phase 2E: Build for Physical Device

When ready to test WebRTC:

### Option 1: EAS Build (Cloud)

```bash
# Install EAS CLI if not already
npm install -g eas-cli

# Login
eas login

# Configure
eas build:configure

# Build development client
eas build --profile development --platform ios
# or
eas build --profile development --platform android
```

### Option 2: Local Build

```bash
# iOS (requires macOS + Xcode)
npx expo prebuild --clean
npx expo run:ios

# Android (requires Android Studio)
npx expo prebuild --clean
npx expo run:android
```

## Phase 2F: Test Navigation Flow

1. Launch app on device
2. Tap "Create Room"
3. Enter room name: "Test Party"
4. Enter your name: "Alice"
5. Tap "Create Room"
6. Verify: Room screen appears with room name and code
7. Verify: You appear in members list
8. Tap "Leave"
9. Verify: Returns to landing screen

## Phase 3A: Add QR Code Display

Update `src/screens/RoomScreen.tsx` to show QR on create:

```typescript
import QRCode from 'react-native-qrcode-svg';
import { formatQRData } from '../utils/roomCode';

// In render:
{currentRoom.isHost && (
  <View style={styles.qrContainer}>
    <QRCode
      value={formatQRData({
        code: currentRoom.code,
        host: currentRoom.hostIP || 'localhost',
        port: currentRoom.port,
        name: currentRoom.name,
      })}
      size={200}
    />
    <Text style={styles.qrHint}>Scan to join</Text>
  </View>
)}
```

## Phase 3B: Add QR Code Scanner

Update `src/screens/JoinScreen.tsx`:

```typescript
import { CameraView, useCameraPermissions } from 'expo-camera';

const [permission, requestPermission] = useCameraPermissions();

const handleBarCodeScanned = ({ data }: { data: string }) => {
  const roomData = parseQRData(data);
  if (roomData) {
    setRoomCode(roomData.code);
    // Auto-connect to room
  }
};

// In render when showScanner is true:
<CameraView
  style={styles.scanner}
  onBarcodeScanned={handleBarCodeScanned}
  barcodeScannerSettings={{
    barcodeTypes: ['qr'],
  }}
/>
```

## Quick Debug Commands

```bash
# Check if dependencies installed correctly
ls -la node_modules | grep -E "zustand|ws|react-navigation"

# Clear cache if issues
yarn cache clean
rm -rf node_modules
yarn install

# Check TypeScript compilation
npx tsc --noEmit

# View Expo config
npx expo config

# Check for errors
npx expo doctor
```

## Common Issues & Fixes

### "Cannot find module 'ws'"

```bash
yarn add ws @types/ws
```

### "expo-camera not compatible"

```bash
# Use SDK-compatible version
npx expo install expo-camera
```

### "WebRTC requires native build"

This is expected. WebRTC won't work in Expo Go. Must build custom dev client.

### TypeScript errors in new files

Make sure imports match the file structure:

```typescript
import { useAppStore } from "../store/appStore";
import type { Room } from "../types/models";
```

---

## Verification Checklist

After Phase 2 installation:

- [ ] `yarn install` completes without errors
- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] App starts: `npx expo start`
- [ ] No red screen errors
- [ ] Can navigate between screens
- [ ] State persists (create room, leave, create again)

---

## Timeline Estimate

- Phase 2A (Dependencies): 10-20 minutes (network dependent)
- Phase 2B (Signaling Server): 30 minutes
- Phase 2C (Integration): 15 minutes
- Phase 2D-E (Build): 20-60 minutes (first time)
- Phase 2F (Test): 10 minutes
- Phase 3A (QR Display): 15 minutes
- Phase 3B (QR Scanner): 30 minutes

**Total: 2-3 hours to complete Phase 2 & 3A/B**

---

Ready to continue when network is stable! 🚀
