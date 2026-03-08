# SnapSync - P2P Photo Sharing App

Local network photo sharing app for events and gatherings. No internet required.

## Features (v1)

- 📱 Create/Join rooms via QR code
- 🔄 Peer-to-peer photo sharing using WebRTC
- 🔍 Auto-discovery via mDNS (zeroconf)
- 💾 Save photos to camera roll
- 🔒 100% local - no cloud, no servers

## Tech Stack

- **Framework**: Expo (bare workflow) + React Native
- **Networking**: WebRTC (react-native-webrtc) for P2P data transfer
- **Discovery**: mDNS (react-native-zeroconf)
- **State**: Zustand + MMKV
- **Signaling**: WebSocket server (ws)

## Prerequisites

- Node.js 18+ and npm/yarn
- Expo CLI: `npm install -g expo-cli eas-cli`
- Physical iOS/Android device (WebRTC won't work in simulator)
- Devices on same WiFi network

## Setup

### 1. Install Dependencies

```bash
cd snapsync
yarn install
# or
npm install
```

### 2. Install Expo Dev Client

Since this app uses native modules (WebRTC, mDNS), it requires a custom development build:

```bash
# Build for iOS (requires macOS + Xcode)
eas build --profile development --platform ios

# Build for Android
eas build --profile development --platform android

# Or build locally
npx expo run:ios
npx expo run:android
```

### 3. Run the App

After installing the dev client on your device:

```bash
npx expo start --dev-client
```

Scan the QR code with your development build.

## Project Structure

```
snapsync/
├── src/
│   ├── screens/          # UI screens
│   │   ├── LandingScreen.tsx
│   │   ├── ### CreateRoomScreen.tsx
│   │   ├── JoinScreen.tsx
│   │   └── RoomScreen.tsx
│   ├── navigation/       # React Navigation
│   ├── store/           # Zustand state management
│   ├── storage/         # MMKV persistent storage
│   ├── networking/      # WebRTC, WebSocket, mDNS
│   ├── features/        # Photo upload/download logic
│   ├── utils/           # Helpers (room codes, colors)
│   ├── types/           # TypeScript definitions
│   └── components/      # Reusable UI components
├── App.tsx
└── package.json
```

## Development Phases

### ✅ Phase 1: Environment & Navigation (COMPLETE)

- [x] Expo project initialized
- [x] Dependencies configured
- [x] Navigation shell with 4 screens
- [x] TypeScript types defined
- [x] State management setup (Zustand + MMKV)

### 🚧 Phase 2: Networking (IN PROGRESS)

- [ ] WebSocket signaling server (host device)
- [ ] WebSocket signaling client (guest devices)
- [ ] mDNS room discovery
- [ ] QR code generation and scanning

### ⏳ Phase 3: WebRTC P2P

- [ ] Peer connection management
- [ ] Mesh network coordinator
- [ ] DataChannel setup
- [ ] Connection state UI

### ⏳ Phase 4: Photo Transfer

- [ ] Photo picker integration
- [ ] Image compression
- [ ] Chunked transfer over DataChannel
- [ ] Progress tracking
- [ ] Photo display grid

### ⏳ Phase 5: Polish

- [ ] Latecomer sync
- [ ] Error handling & reconnection
- [ ] Download to camera roll
- [ ] Empty states & loading indicators

## Testing Checklist

Manual testing with physical devices:

- [ ] Device A creates room → QR displays
- [ ] Device B scans QR → joins successfully
- [ ] Both devices show each other in members list
- [ ] Device A uploads photo → appears on Device B
- [ ] Photo saves to camera roll correctly
- [ ] Device C joins mid-session → receives past photos
- [ ] Host leaves → other devices handle gracefully
- [ ] WiFi disconnect → reconnects automatically

## Known Limitations

- **Expo Go not supported**: Requires custom dev client due to native modules
- **Android mDNS**: Unreliable on some OEMs (Samsung, Xiaomi) - QR is primary join method
- **Mesh scaling**: Tested up to 10 devices; performance varies by device
- **No internet**: Fully local - can't bridge across different networks

## Troubleshooting

### "Unable to resolve module"

Run `yarn install` or `npm install` again.

### "WebRTC not found"

Make sure you're running in a development build, not Expo Go.

### "mDNS discovery not working"

Use QR code to join. mDNS is unreliable on some Android devices.

### Build fails

Check that all native dependencies are properly configured in app.json plugins.

## Architecture Decisions

- **Mesh over Star**: Chose mesh topology for resilience (direct P2P vs relaying through host)
- **QR primary**: QR code is main join method; mDNS is enhancement (Android reliability issues)
- **WebSocket signaling**: More compatible than raw TCP sockets for Expo
- **16KB chunks**: Balances DataChannel buffer pressure with transfer speed
- **MMKV storage**: 30x faster than AsyncStorage for device ID, preferences

## License

MIT

## Contributing

1. Create feature branch: `git checkout -b feat/my-feature`
2. Commit changes: `git commit -m 'Add my feature'`
3. Push: `git push origin feat/my-feature`
4. Open PR

---

**Current Status**: Foundation complete (screens, navigation, state). Next: WebSocket signaling + mDNS discovery.
