# SnapSync - Implementation Progress

## ✅ Phase 1 COMPLETE: Foundation & Navigation Shell

### What's Been Built

#### 1. Project Structure ✅

```
snapsync/
├── src/
│   ├── screens/          # All 4 main screens implemented
│   │   ├── LandingScreen.tsx     ✅ Create/Join buttons
│   │   ├── CreateRoomScreen.tsx  ✅ Room name + user name form
│   │   ├── JoinScreen.tsx        ✅ QR scan + manual code entry
│   │   └── RoomScreen.tsx        ✅ Photo grid + members + FAB
│   ├── navigation/
│   │   └── AppNavigator.tsx      ✅ React Navigation stack
│   ├── store/
│   │   └── appStore.ts           ✅ Zustand state management
│   ├── storage/
│   │   └── mmkvStore.ts          ✅ MMKV persistence layer
│   ├── types/
│   │   └── models.ts             ✅ TypeScript interfaces
│   └── utils/
│       ├── roomCode.ts           ✅ Code generation, QR parsing
│       └── colors.ts             ✅ Member color generation
├── App.tsx                       ✅ Entry point
├── app.json                      ✅ Expo config with permissions
├── package.json                  ✅ Base dependencies
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

- Header: room name + code + leave button
- Members row: colored avatar circles with count
- Photo grid: 3 columns, square items, member badge overlay
- Empty state: "No photos yet. Tap + to add some!"
- FAB: + button for photo upload (placeholder)

#### 6. Configuration ✅

**app.json**:

- iOS permissions: Camera, Photos, Microphone, Local Network, Bonjour
- Android permissions: Camera, Storage, Network, WiFi
- Config plugins array ready for WebRTC + expo-camera
- Bundle IDs: `com.snapsync.app`

**package.json**:

- Base: Expo 55, React Native 0.83, React 19.2
- Navigation: React Navigation v7 (native + native-stack)
- State: Zustand v5
- TypeScript with strict type checking

#### 7. Navigation Flow ✅

```
Landing → CreateRoom → Room
        → Join → Room
```

- Type-safe navigation with `RootStackParamList`
- No back button on Room screen (must use Leave button)
- Proper screen transitions

---

## 🚧 Next Phase: Networking Layer

### Phase 2A: WebSocket Signaling (Priority 1)

Create `src/networking/signalingServer.ts`:

- Host starts WebSocket server on port 8888 using `ws` library
- Message types: peer-list, member-join, member-leave, offer, answer, ice-candidate
- Broadcast member list to all connected clients
- Route messages between specific peers for WebRTC handshake

Create `src/networking/signalingClient.ts`:

- Guest connects to `ws://hostIP:8888`
- Send member-join with name and device ID
- Listen for peer updates
- Handle reconnection with exponential backoff

### Phase 2B: mDNS Discovery (Priority 2)

**Dependencies to add**:

```json
"react-native-zeroconf": "^0.13.0"
```

Create `src/networking/discovery.ts`:

- Publisher: Host advertises `_snapsync._tcp.local.` with code, room name, port
- Scanner: Guests discover nearby rooms with retry logic (5 attempts, 500ms delays)
- Use DNSSD mode for Android reliability
- Display discovered rooms on Landing screen

### Phase 2C: QR Code (Priority 1)

**Dependencies to add**:

```json
"react-native-qrcode-svg": "^6.3.11",
"react-native-svg": "~15.5.0",
"expo-camera": "~16.0.0"
```

Implement:

- Generate QR code on CreateRoomScreen → show after room created
- Scan QR code on JoinScreen → parse and connect
- Fallback to manual code entry if scan fails

---

## 🔮 Phase 3: WebRTC Mesh (Days 4-5)

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
