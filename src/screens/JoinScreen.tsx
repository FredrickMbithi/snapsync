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
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useAppStore } from '../store/appStore';
import { parseQRData, generateDeviceId } from '../utils/roomCode';
import { generateMemberColor } from '../utils/colors';
import { saveUserName, getUserName } from '../storage/mmkvStore';
import SignalingManager from '../networking/signalingManager';
import QRScanner from '../components/QRScanner';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Join'>;
};

export default function JoinScreen({ navigation }: Props) {
  const [roomCode, setRoomCode] = useState('');
  const [userName, setUserName] = useState('');
  const [hostIP, setHostIP] = useState(''); // Will come from QR scan or manual entry
  const [isJoining, setIsJoining] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  
  const setCurrentRoom = useAppStore((state) => state.setCurrentRoom);
  
  // Load saved username after mount (avoids native module timing issues)
  useEffect(() => {
    try {
      const savedName = getUserName();
      if (savedName) setUserName(savedName);
    } catch (e) {
      console.warn('Failed to load saved username:', e);
    }
  }, []);
  const addMember = useAppStore((state) => state.addMember);
  const setConnectionStatus = useAppStore((state) => state.setConnectionStatus);

  const handleJoinRoom = async () => {
    if (!roomCode.trim() || !userName.trim()) {
      return;
    }

    setIsJoining(true);
    setConnectionStatus('connecting');
    
    try {
      const deviceId = generateDeviceId();
      const color = generateMemberColor(userName.trim());
      
      const room = {
        id: `guest-${deviceId}`,
        name: 'Room', // Will be updated from host
        code: roomCode.trim().toUpperCase(),
        myName: userName.trim(),
        myId: deviceId,
        isHost: false,
        port: 8888,
        hostIP: hostIP.trim(),
      };
      
      // Save preferences
      saveUserName(userName.trim());
      
      // Create member info
      const myMember = {
        id: deviceId,
        name: userName.trim(),
        color,
        isHost: false,
        peerId: deviceId,
      };
      
      // Set room state first
      setCurrentRoom(room);
      addMember(myMember);
      
      // Connect to signaling server
      try {
        const client = SignalingManager.getClient(hostIP.trim(), 8888);
        
        // Set up event handlers
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
          // TODO: Add peers to member list
          // TODO: Initiate WebRTC connections
        });
        
        client.on('onMemberJoin', (member) => {
          console.log('[JoinScreen] Member joined:', member.name);
          addMember(member);
          // TODO: Initiate WebRTC connection with new peer
        });
        
        client.on('onError', (error) => {
          console.error('[JoinScreen] Signaling error:', error);
          Alert.alert('Connection Error', 'Lost connection to host. Please try rejoining.');
        });
        
        // Connect
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
      
      // Navigate to room
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
    
    // Fill in the form with scanned data
    setRoomCode(parsed.code);
    setHostIP(parsed.host);
    setShowScanner(false);
    
    Alert.alert(
      'QR Code Scanned',
      `Room: ${parsed.name}\nCode: ${parsed.code}`,
      [
        { text: 'OK', onPress: () => {} }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.form}>
          <Text style={styles.title}>Join Room</Text>
          
          <TouchableOpacity
            style={styles.scanButton}
            onPress={handleQRScan}
          >
            <Text style={styles.scanButtonText}>📷 Scan QR Code</Text>
          </TouchableOpacity>
          
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Host IP Address</Text>
            <TextInput
              style={styles.input}
              placeholder="192.168.1.100"
              value={hostIP}
              onChangeText={setHostIP}
              keyboardType="decimal-pad"
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Room Code</Text>
            <TextInput
              style={styles.input}
              placeholder="KP73"
              value={roomCode}
              onChangeText={(text) => setRoomCode(text.toUpperCase())}
              autoCapitalize="characters"
              maxLength={4}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your Name</Text>
            <TextInput
              style={styles.input}
              placeholder="John"
              value={userName}
              onChangeText={setUserName}
              returnKeyType="done"
              onSubmitEditing={handleJoinRoom}
            />
          </View>
          
          <TouchableOpacity
            style={[
              styles.button,
              (!roomCode.trim() || !userName.trim() || !hostIP.trim() || isJoining) && styles.buttonDisabled,
            ]}
            onPress={handleJoinRoom}
            disabled={!roomCode.trim() || !userName.trim() || !hostIP.trim() || isJoining}
          >
            {isJoining ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Join Room</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
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
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  form: {
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 32,
    textAlign: 'center',
  },
  scanButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  scanButtonText: {
    color: '#3B82F6',
    fontSize: 18,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D1D5DB',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#9CA3AF',
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1A1A',
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
  },
});
