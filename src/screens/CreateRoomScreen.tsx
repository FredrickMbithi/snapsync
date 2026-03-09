import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useAppStore } from '../store/appStore';
import { generateRoomCode, generateDeviceId, formatQRData } from '../utils/roomCode';
import { generateMemberColor } from '../utils/colors';
import { saveRecentRoom, saveUserName, getUserName } from '../storage/mmkvStore';
import { getLocalIPAddress } from '../utils/network';
import SignalingManager from '../networking/signalingManager';
import { colors, borderRadius, spacing, shadows } from '../utils/theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CreateRoom'>;
};

export default function CreateRoomScreen({ navigation }: Props) {
  const [roomName, setRoomName] = useState('');
  const [userName, setUserName] = useState('');
  const [hostIP, setHostIP] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toLocaleDateString());
  const [isCreating, setIsCreating] = useState(false);
  const [isDetectingIP, setIsDetectingIP] = useState(true);
  
  const setCurrentRoom = useAppStore((state) => state.setCurrentRoom);
  const addMember = useAppStore((state) => state.addMember);

  // Load saved username after mount
  useEffect(() => {
    try {
      const savedName = getUserName();
      if (savedName) setUserName(savedName);
    } catch (e) {
      console.warn('Failed to load saved username:', e);
    }
  }, []);

  // Auto-detect IP address on mount
  useEffect(() => {
    const detectIP = async () => {
      setIsDetectingIP(true);
      const ip = await getLocalIPAddress();
      if (ip) {
        setHostIP(ip);
      }
      setIsDetectingIP(false);
    };
    detectIP();
  }, []);

  const handleCreateRoom = async () => {
    if (!roomName.trim() || !userName.trim()) {
      Alert.alert('Missing Info', 'Please enter event name and your name');
      return;
    }

    if (!hostIP.trim()) {
      Alert.alert('No Network', 'Could not detect your IP address. Make sure you are connected to WiFi.');
      return;
    }

    setIsCreating(true);
    
    try {
      // Try to start TCP signaling server (native module may be missing in Expo)
      let actualPort = 8888;
      try {
        console.log('[CreateRoom] Starting TCP signaling server...');
        actualPort = await SignalingManager.startServer(0); // Auto-assign port
        console.log(`[CreateRoom] Server started on port ${actualPort}`);
      } catch (startError) {
        console.warn('[CreateRoom] TCP server unavailable, using fallback port 8888', startError);
        actualPort = 8888;
      }
      
      const code = generateRoomCode();
      const deviceId = generateDeviceId();
      const color = generateMemberColor(userName.trim());
      
      const room = {
        id: deviceId,
        name: roomName.trim(),
        code,
        myName: userName.trim(),
        myId: deviceId,
        isHost: true,
        port: actualPort,
        hostIP: hostIP.trim(),
      };
      
      // Save preferences
      saveUserName(userName.trim());
      saveRecentRoom({ id: room.id, name: room.name, code: room.code });
      
      // Set room state
      setCurrentRoom(room);
      
      // Add self as first member
      addMember({
        id: deviceId,
        name: userName.trim(),
        color,
        isHost: true,
        peerId: deviceId,
      });
      
      console.log(`[CreateRoom] Room created - host IP: ${hostIP}, port: ${actualPort}`);
      
      // Navigate to room
      navigation.replace('Room');
    } catch (error) {
      console.warn('Error creating room:', error);
      // Stop server if it was started
      try {
        await SignalingManager.stopServer();
      } catch (stopError) {
        console.warn('[CreateRoom] Failed to stop server after error', stopError);
      }
      Alert.alert('Error', 'Failed to create room. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      
      <View style={styles.background} pointerEvents="none">
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />
      </View>
      
      {/* Topbar */}
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>Host Event</Text>
        <View style={styles.topbarRight} />
      </View>
      
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.formBody} contentContainerStyle={styles.formContent}>
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Create your room</Text>

            {/* Event Name */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>EVENT NAME</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="Sarah's Birthday 🎂"
                placeholderTextColor={colors.text3}
                value={roomName}
                onChangeText={setRoomName}
                autoFocus
              />
            </View>
            
            {/* Your Name */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>YOUR NAME</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="Your name"
                placeholderTextColor={colors.text3}
                value={userName}
                onChangeText={setUserName}
              />
            </View>
            
            {/* Event Date */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>EVENT DATE</Text>
              <View style={styles.dateInput}>
                <Text style={styles.dateText}>{eventDate}</Text>
                <Text style={styles.dateIcon}>📅</Text>
              </View>
            </View>
            
            {/* Tip Box */}
            <View style={styles.tipBox}>
              <Text style={styles.tipText}>
                <Text style={styles.tipBold}>How it works: </Text>
                You get a room code + QR. Show it on your screen — guests scan and join instantly. Photos sync peer-to-peer over WiFi. No internet needed.
              </Text>
            </View>
            
            {/* IP Address (hidden but functional) */}
            {isDetectingIP && (
              <View style={styles.ipDetecting}>
                <ActivityIndicator size="small" color={colors.gold} />
                <Text style={styles.ipText}>Detecting network...</Text>
              </View>
            )}
          </View>
        </ScrollView>
        
        {/* Bottom CTA */}
        <View style={styles.formFoot}>
          <TouchableOpacity
            style={[
              styles.btnGold,
              (!roomName.trim() || !userName.trim() || isCreating) && styles.btnDisabled,
            ]}
            onPress={handleCreateRoom}
            disabled={!roomName.trim() || !userName.trim() || isCreating}
            activeOpacity={0.8}
          >
            {isCreating ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <Text style={styles.btnGoldText}>Generate Room →</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  glowTop: {
    position: 'absolute',
    top: -100,
    left: -50,
    width: 260,
    height: 260,
    borderRadius: 180,
    backgroundColor: colors.goldGlow,
    opacity: 0.35,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -120,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 180,
    backgroundColor: colors.surface3,
    opacity: 0.25,
  },
  
  // Topbar
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 44,
  },
  backBtnText: {
    color: colors.gold,
    fontSize: 28,
    fontWeight: '600',
  },
  topbarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.5,
  },
  topbarRight: {
    width: 44,
  },
  
  // Form
  keyboardView: {
    flex: 1,
  },
  formBody: {
    flex: 1,
  },
  formContent: {
    padding: spacing.lg,
  },
  formCard: {
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1,
    borderColor: colors.border2,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.soft,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  field: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 1.5,
    color: colors.text3,
    marginBottom: 8,
  },
  fieldInput: {
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1.5,
    borderColor: colors.border2,
    borderRadius: borderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  dateInput: {
    backgroundColor: colors.surface2,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 16,
    color: colors.text,
  },
  dateIcon: {
    fontSize: 18,
  },
  
  // Tip Box
  tipBox: {
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: 14,
    marginTop: spacing.sm,
    ...shadows.soft,
  },
  tipText: {
    fontSize: 13,
    color: colors.text2,
    lineHeight: 20,
  },
  tipBold: {
    color: colors.text,
    fontWeight: '600',
  },
  
  // IP Detecting
  ipDetecting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    gap: 8,
  },
  ipText: {
    fontSize: 12,
    color: colors.text3,
  },
  
  // Bottom CTA
  formFoot: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  btnGold: {
    backgroundColor: colors.gold,
    paddingVertical: 16,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.glow,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnGoldText: {
    color: colors.bg,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
