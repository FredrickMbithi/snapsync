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
  Modal,
  ScrollView,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useAppStore } from '../store/appStore';
import { parseQRData, generateDeviceId } from '../utils/roomCode';
import { generateMemberColor } from '../utils/colors';
import { saveUserName, getUserName } from '../storage/mmkvStore';
import SignalingManager from '../networking/signalingManager';
import QRScanner from '../components/QRScanner';
import { colors, borderRadius, spacing } from '../utils/theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Join'>;
};

export default function JoinScreen({ navigation }: Props) {
  const [roomCode, setRoomCode] = useState('');
  const [userName, setUserName] = useState('');
  const [hostIP, setHostIP] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  
  const setCurrentRoom = useAppStore((state) => state.setCurrentRoom);
  const addMember = useAppStore((state) => state.addMember);
  const setConnectionStatus = useAppStore((state) => state.setConnectionStatus);
  
  // Load saved username after mount
  useEffect(() => {
    try {
      const savedName = getUserName();
      if (savedName) setUserName(savedName);
    } catch (e) {
      console.warn('Failed to load saved username:', e);
    }
  }, []);

  const handleJoinRoom = async () => {
    if (!roomCode.trim() || !userName.trim()) {
      Alert.alert('Missing Info', 'Please enter room code and your name');
      return;
    }

    setIsJoining(true);
    setConnectionStatus('connecting');
    
    try {
      const deviceId = generateDeviceId();
      const color = generateMemberColor(userName.trim());
      
      const room = {
        id: `guest-${deviceId}`,
        name: 'Room',
        code: roomCode.trim().toUpperCase(),
        myName: userName.trim(),
        myId: deviceId,
        isHost: false,
        port: 8888,
        hostIP: hostIP.trim(),
      };
      
      saveUserName(userName.trim());
      
      const myMember = {
        id: deviceId,
        name: userName.trim(),
        color,
        isHost: false,
        peerId: deviceId,
      };
      
      setCurrentRoom(room);
      addMember(myMember);
      
      // Connect to signaling server
      try {
        const client = SignalingManager.getClient(hostIP.trim(), 8888);
        
        client.on('onConnect', () => {
          console.log('[JoinScreen] Connected to signaling server');
          setConnectionStatus('connected');
        });
        
        client.on('onDisconnect', () => {
          console.log('[JoinScreen] Disconnected from signaling server');
          setConnectionStatus('disconnected');
        });
        
        client.on('onPeerList', (peers) => {
          console.log('[JoinScreen] Received peer list:', peers.length);
        });
        
        client.on('onMemberJoin', (member) => {
          console.log('[JoinScreen] Member joined:', member.name);
          addMember(member);
        });
        
        client.on('onError', (error) => {
          console.error('[JoinScreen] Signaling error:', error);
          Alert.alert('Connection Error', 'Lost connection to host. Please try rejoining.');
        });
        
        await client.connect(myMember);
        console.log('[JoinScreen] Successfully joined room');
        
      } catch (error) {
        console.error('[JoinScreen] Failed to connect to signaling server:', error);
        Alert.alert(
          'Connection Failed',
          'Could not connect to room. Please check the host IP and try again.',
          [{ text: 'OK' }]
        );
        setConnectionStatus('disconnected');
        setIsJoining(false);
        return;
      }
      
      navigation.replace('Room');
    } catch (error) {
      console.error('Error joining room:', error);
      Alert.alert('Error', 'Could not join room. Please try again.');
      setConnectionStatus('disconnected');
    } finally {
      setIsJoining(false);
    }
  };

  const handleQRScan = () => {
    setShowScanner(true);
  };

  const handleQRData = (qrData: string) => {
    const parsed = parseQRData(qrData);
    if (!parsed) {
      Alert.alert('Invalid QR Code', 'This QR code is not from SnapSync');
      setShowScanner(false);
      return;
    }
    
    setRoomCode(parsed.code);
    setHostIP(parsed.host);
    setShowScanner(false);
    
    Alert.alert(
      'QR Code Scanned',
      `Room: ${parsed.name}\nCode: ${parsed.code}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      
      {/* Topbar */}
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.topbarTitle}>Join Event</Text>
        <View style={styles.topbarRight} />
      </View>
      
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.formBody} contentContainerStyle={styles.formContent}>
          {/* Scan QR Button */}
          <TouchableOpacity
            style={styles.scanBtn}
            onPress={handleQRScan}
            activeOpacity={0.8}
          >
            <Text style={styles.scanBtnIcon}>📷</Text>
            <Text style={styles.scanBtnText}>Scan QR Code</Text>
          </TouchableOpacity>
          
          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR ENTER MANUALLY</Text>
            <View style={styles.dividerLine} />
          </View>
          
          {/* Room Code */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>ROOM CODE</Text>
            <TextInput
              style={[styles.fieldInput, styles.codeInput]}
              placeholder="KP73"
              placeholderTextColor={colors.text3}
              value={roomCode}
              onChangeText={(text) => setRoomCode(text.toUpperCase())}
              autoCapitalize="characters"
              maxLength={4}
            />
          </View>
          
          {/* Host IP */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>HOST IP ADDRESS</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="192.168.1.100"
              placeholderTextColor={colors.text3}
              value={hostIP}
              onChangeText={setHostIP}
              keyboardType="decimal-pad"
              autoCapitalize="none"
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
          
          {/* Tip Box */}
          <View style={styles.tipBox}>
            <Text style={styles.tipText}>
              <Text style={styles.tipBold}>Tip: </Text>
              Ask the host to show their QR code for quick joining. Make sure you're connected to the same WiFi network.
            </Text>
          </View>
        </ScrollView>
        
        {/* Bottom CTA */}
        <View style={styles.formFoot}>
          <TouchableOpacity
            style={[
              styles.btnGold,
              (!roomCode.trim() || !userName.trim() || isJoining) && styles.btnDisabled,
            ]}
            onPress={handleJoinRoom}
            disabled={!roomCode.trim() || !userName.trim() || isJoining}
            activeOpacity={0.8}
          >
            {isJoining ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <Text style={styles.btnGoldText}>Join Room →</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      
      {/* QR Scanner Modal */}
      <Modal
        visible={showScanner}
        animationType="slide"
        onRequestClose={() => setShowScanner(false)}
      >
        <QRScanner
          onScan={handleQRData}
          onClose={() => setShowScanner(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
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
  
  // Scan Button
  scanBtn: {
    backgroundColor: colors.surface2,
    borderWidth: 2,
    borderColor: colors.gold,
    borderRadius: borderRadius.md,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  scanBtnIcon: {
    fontSize: 22,
  },
  scanBtnText: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 12,
    color: colors.text3,
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 1,
  },
  
  // Fields
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
    backgroundColor: colors.surface2,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  codeInput: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 8,
    textAlign: 'center',
    paddingVertical: 18,
  },
  
  // Tip Box
  tipBox: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: 14,
    marginTop: spacing.sm,
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
