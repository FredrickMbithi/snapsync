# SnapSync - Implementation Progress

## ✅ Phase 1 COMPLETE: Foundation & Navigation Shell

### What's Been Built

#### 1. Project Structure ✅

```
snapsync/
├── src/
│   ├── screens/          # All 4 main screens (REDESIGNED)
│   │   ├── LandingScreen.tsx     ✅ Dark theme, SNAP/SYNC hero
│   │   ├── CreateRoomScreen.tsx  ✅ Dark form, gold CTA
│   │   ├── JoinScreen.tsx        ✅ QR scan + manual code
│   │   └── RoomScreen.tsx        ✅ Stats bar, upload strip
│   ├── components/
│   │   ├── QRScanner.tsx         ✅ CameraView + gold corners
│   │   └── QRCodeView.tsx        ✅ SVG QR generation
│   ├── navigation/
│   │   └── AppNavigator.tsx      ✅ React Navigation stack
│   ├── store/
│   │   └── appStore.ts           ✅ Zustand state management
│   ├── storage/
│   │   └── mmkvStore.ts          ✅ MMKV (lazy init)
│   ├── networking/
│   │   ├── signalingServer.ts    ✅ Code ready (Node.js)
│   │   ├── signalingClient.ts    ✅ Code ready (disabled)
│   │   └── signalingManager.ts   ✅ Coordinator
│   ├── types/
│   │   └── models.ts             ✅ TypeScript interfaces
│   └── utils/
│       ├── theme.ts              ✅ Colors, spacing, typography
│       ├── roomCode.ts           ✅ Code generation, QR parsing
│       ├── colors.ts             ✅ Member color generation
│       └── network.ts            ✅ IP detection
├── App.tsx                       ✅ Entry point
├── app.json                      ✅ Expo config with permissions
├── package.json                  ✅ All dependencies
└── README.md                     ✅ Documentation
```

#### 2. TypeScript Types ✅

All core data models defined:

- `Photo`: id, uri, from, fromColor, ts, sizeBytes, thumbnail
- `Member`: id, name, color, isHost, peerId
- `Room`: id, name, code, myName, myId, isHost, port, hostIP
- `SignalingMessage`: peer-list, member-join, offer, answer, ice-candidate
- `PhotoMessage`: photo-start, photo-chunk, photo-end, photo-manifest
- `TransferProgress`: photoId, sent, total, peerId

#### 3. State Management ✅

**Zustand Store** (`appStore.ts`):

- Current room state
- Members array
- Photos array
- Transfer progress map
- Connection status
- Actions: setCurrentRoom, leaveRoom, addMember, addPhoto, updateTransferProgress
- Selectors: getMyPhotos, getPhotosByMember, getConnectedPeers

**MMKV Storage** (`mmkvStore.ts`):

- Device ID generation (persistent)
- User name preferences
- Recent rooms list (last 10)
- Downloaded photos tracking
- All with encryption enabled

#### 4. Utilities ✅

**Room Code** (`roomCode.ts`):

- Generate 4-char codes (e.g., "KP73")
- Format QR data: `snapsync://join?code=XX&host=IP&port=8888&name=Room`
- Parse QR data back to room parameters
- Device ID generation

**Colors** (`colors.ts`):

- 10 predefined colors for member avatars
- Deterministic color from name (same name = same color)

#### 5. UI Screens ✅

**Landing Screen**:

- Clean hero layout with app name
- "Create Room" primary button
- "Join Room" secondary button
- Footer: "No internet required" + "Same WiFi only"

**Create Room Screen**:

- Room name input (e.g., "Birthday Party 🎉")
- User name input (saved to preferences)
- Create button → generates code → navigates to Room
- Stores self as first member with generated color

**Join Screen**:

- "Scan QR Code" button (placeholder)
- Manual code entry (4-char uppercase, auto-capitalized)
- User name input
- Join button (TODO: connect to signaling)

**Room Screen**:

- Header: room name + code pill + QR button + leave
- Stats bar: people count, photo count, LIVE indicator
- Members row: colored avatar circles with host badge
- Photo grid: 3 columns, square items, member badge overlay
- Empty state: "No photos yet" with camera icon
- Upload strip: Gold "+ Upload Photos" button

---

## ✅ Phase 2 COMPLETE: UI & QR Code

### What's Been Built

#### 1. Design System (theme.ts) ✅

```typescript
colors: {
  bg: '#0e0c0a',        // Near black background
  surface1: '#161410',  // Card backgrounds
  surface2: '#1e1b17',  // Input backgrounds
  surface3: '#28251f',  // Elevated surfaces
  gold: '#f0b429',      // Primary accent
  text: '#f4efe8',      // Primary text
  text2: '#9a9186',     // Secondary text
  text3: '#5a5448',     // Muted text
  // ... more colors
}
```

#### 2. Screen Redesigns ✅

**LandingScreen**:

- SNAP/SYNC hero with gold accent
- "Nearby Events" section with JOIN pills
- Two gold CTA buttons: Host / Join
- "No internet required" footer

**CreateRoomScreen**:

- Dark topbar with back button
- EVENT NAME, YOUR NAME, EVENT DATE fields
- Tip box explaining how it works
- Gold "Generate Room →" button

**JoinScreen**:

- QR scan button with camera icon
- "OR ENTER MANUALLY" divider
- Large monospace room code input
- Tip box about scanning QR

**RoomScreen**:

- Header with code pill and QR button
- Stats bar (people/photos/LIVE)
- Member avatars with host badge
- Upload strip at bottom
- Dark QR modal with gold accents

#### 3. QR Components ✅

**QRScanner.tsx**:

- Uses expo-camera CameraView
- Gold corner markers
- Dark semi-transparent overlay
- Permission request screen
- Scanned success animation

**QRCodeView.tsx**:

- Uses react-native-qrcode-svg
- Generates snapsync:// URLs
- Displays room code and IP

#### 4. Signaling Code (Disabled for UI testing) ✅

- signalingServer.ts: WebSocket server (requires Node.js)
- signalingClient.ts: WebSocket client
- signalingManager.ts: Coordinator singleton
- Message types: peer-list, member-join, offer, answer, ice-candidate

---

## 🚧 Next Phase: P2P Networking

**Dependencies to add**:

```json
"react-native-webrtc": "^124.0.4",
"@config-plugins/react-native-webrtc": "^9.0.0"
```

Create `src/networking/peerConnection.ts`:

- Factory: `createPeerConnection(remotePeerId, onDataChannel, onIceCandidate)`
- Config: `{ iceServers: [] }` (local network only)
- Setup ordered, reliable DataChannel named "photos"

Create `src/networking/meshNetwork.ts`:

- Maintain `Map<peerId, RTCPeerConnection>`
- On new member: initiate WebRTC handshakes
- Exchange offers/answers via signaling server
- Track connection states in Zustand

Wire up:

- RoomScreen shows green dot when DataChannel is open
- Connection count in header
- Auto-retry failed connections (up to 3 times)

---

## 🔮 Phase 4: Photo Transfer (Days 5-6)

**Dependencies to add**:

```json
"expo-image-picker": "~16.0.0",
"expo-image-manipulator": "~14.0.0",
"expo-file-system": "~18.0.0",
"expo-media-library": "~18.0.0"
```

Create `src/features/photoUpload.ts`:

- Pick photos with expo-image-picker
- Compress to max 1200px width, JPEG quality 0.8
- Generate thumbnail (300x300)
- Calculate SHA-256 as photo ID

Create `src/networking/photoTransfer.ts`:

- Chunked sender: split into 16KB chunks, monitor bufferedAmount
- Message flow: photo-start → photo-chunk × N → photo-end
- Chunked receiver: reassemble base64, write to FileSystem cache
- Progress tracking in Zustand

Broadcast:

- Iterate all DataChannels in mesh
- Send photo to each peer concurrently
- Retry up to 3 times per peer on failure

---

## 🔮 Phase 5: Polish (Days 6-7)

### Photo Display

- Full-screen modal on photo tap
- Swipe to dismiss
- Download button → save to camera roll via expo-media-library
- Share button → native share sheet

### Latecomer Sync

- On DataChannel open: exchange photo manifests
- Request missing photos via photo-request message
- Show "Syncing X photos..." banner

### Error Handling

- Retry WebRTC when ICE state fails
- Reconnect WebSocket on disconnect
- Store pending transfers in MMKV
- Resume after reconnect
- Offline indicators in UI

### Empty States & Loading

- Landing: "Create your first room"
- Room: "No photos yet"
- Join: "No nearby rooms found"
- Skeleton loaders for photo grid
- Spinner during room creation

---

## 📦 Dependencies Status

### ✅ Installed (Base)

- expo ~55.0.5
- expo-status-bar ~55.0.4
- react 19.2.0
- react-native 0.83.2
- @react-navigation/native ^7.0.11
- @react-navigation/native-stack ^7.1.8
- zustand ^5.0.2

### ⏳ To Install (Phase 2)

```bash
npx expo install expo-camera expo-dev-client
npx expo install react-native-svg
yarn add react-native-qrcode-svg
yarn add ws @types/ws
yarn add react-native-zeroconf
```

### ⏳ To Install (Phase 3)

```bash
yarn add react-native-webrtc @config-plugins/react-native-webrtc
yarn add react-native-mmkv
```

### ⏳ To Install (Phase 4)

```bash
npx expo install expo-image-picker expo-image-manipulator expo-file-system expo-media-library
```

---

## 🚀 Next Steps

### Immediate (Next 1-2 hours)

1. ✅ Test base navigation on device: `npx expo start`
2. Install Phase 2 dependencies
3. Implement WebSocket signaling server (host)
4. Implement WebSocket signaling client (guest)
5. Test: 2 devices connect via WebSocket

### Short-term (Next 2-3 hours)

6. Add QR code generation on CreateRoomScreen
7. Add QR code scanning on JoinScreen
8. Test: Join via QR code
9. Implement mDNS discovery
10. Test: Auto-discover nearby rooms

### Medium-term (Days 2-3)

11. Setup WebRTC peer connections
12. Establish DataChannel between 2 peers
13. Test: Send text message P2P
14. Scale to mesh with 3-5 peers
15. Test: Message reaches all peers

### Long-term (Days 4-7)

16. Implement photo upload + compression
17. Implement chunked photo transfer
18. Test: Photo appears on all devices
19. Add latecomer sync
20. Polish UI and error handling

---

## 🐛 Known Issues & Workarounds

### Network Issues During Setup

The environment has intermittent connectivity. If `yarn install` fails:

```bash
yarn cache clean
yarn install --network-timeout 100000
```

### Expo Version Compatibility

Some packages prompt for version selection. Use:

- expo-camera: 55.0.x (matching Expo 55)
- Other expo-\* packages: Match Expo SDK version

### MMKV requires rebuild

After adding react-native-mmkv, must rebuild:

```bash
npx expo prebuild --clean
npx expo run:ios  # or run:android
```

### WebRTC not in Expo Go

Cannot test in Expo Go. Must use:

```bash
eas build --profile development --platform ios
# Install on device, then:
npx expo start --dev-client
```

---

## 📝 Testing Checklist (Phase 1)

### Manual Testing (Base Navigation)

- [ ] App launches without errors
- [ ] Landing screen shows with 2 buttons
- [ ] "Create Room" navigates to CreateRoomScreen
- [ ] "Join Room" navigates to JoinScreen
- [ ] CreateRoomScreen accepts input and creates room
- [ ] RoomScreen shows after creation with room name + code
- [ ] Join screen accepts 4-char code (auto-uppercase)
- [ ] Leave button works and returns to Landing

### State Testing

- [ ] Created room appears in appStore.currentRoom
- [ ] Self appears as first member
- [ ] Room saved to MMKV recent rooms
- [ ] User name saved to MMKV
- [ ] Leave room clears all state

---

## 🎯 Success Criteria for v1

### Must Work (v1 Definition)

- [ ] Host creates room → QR code appears
- [ ] Guest scans/enters code → joins room
- [ ] Both see each other in members list (green indicators)
- [ ] Host uploads photo → Guest receives it < 10 seconds
- [ ] Guest taps photo → saves to camera roll successfully
- [ ] Latecomer joins → receives all past photos (catch-up sync)
- [ ] Works with 5 devices simultaneously on same WiFi
- [ ] Works with zero internet connection

### Nice to Have (v1.5)

- mDNS auto-discovery (nearby rooms list)
- In-room chat
- Photo compression settings
- Bulk export (ZIP download)

---

## 📊 Current Progress: ~40% Complete

**Completed:**

- ✅ Project foundation & tooling
- ✅ TypeScript types & models
- ✅ State management architecture
- ✅ Persistent storage layer
- ✅ UI screens & navigation
- ✅ Utilities (codes, colors)

**In Progress:**

- 🚧 Dependency installation (network issues)

**Blocked:**

- ⏸️ Awaiting stable network for remaining deps
- ⏸️ Requires physical device for WebRTC testing

**Next Critical Path:**

1. WebSocket signaling (enables peer discovery)
2. QR code generation/scanning (enables room joining)
3. WebRTC DataChannel (enables P2P transfer)
4. Photo transfer protocol (actual feature)

---

**Last Updated**: March 8, 2026  
**Status**: Foundation complete, ready for networking layer  
**Blocker**: Network stability for additional dependencies
