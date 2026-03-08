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
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useAppStore } from '../store/appStore';
import { generateRoomCode, generateDeviceId, formatQRData } from '../utils/roomCode';
import { generateMemberColor } from '../utils/colors';
import { saveRecentRoom, saveUserName, getUserName } from '../storage/mmkvStore';
import SignalingManager from '../networking/signalingManager';
import { getLocalIPAddress } from '../utils/network';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CreateRoom'>;
};

export default function CreateRoomScreen({ navigation }: Props) {
  const [roomName, setRoomName] = useState('');
  const [userName, setUserName] = useState(getUserName() || '');
  const [hostIP, setHostIP] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isDetectingIP, setIsDetectingIP] = useState(true);
  
  const setCurrentRoom = useAppStore((state) => state.setCurrentRoom);
  const addMember = useAppStore((state) => state.addMember);

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
      return;
    }

    setIsCreating(true);
    
    try {
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
        port: 8888,
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
      
      // Start WebSocket signaling server
      try {
        const server = SignalingManager.getServer(8888);
        await server.start((clients) => {
          console.log(`[CreateRoom] Connected clients: ${clients.length}`);
          // Members are added via signaling messages
        });
        console.log('[CreateRoom] Signaling server started on port 8888');
      } catch (error) {
        console.error('[CreateRoom] Failed to start signaling server:', error);
        Alert.alert(
          'Server Error',
          'Failed to start signaling server. Please try again.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }
      
      // TODO: Start mDNS advertising
      
      // Navigate to room
      navigation.replace('Room');
    } catch (error) {
      console.error('Error creating room:', error);
      Alert.alert('Error', 'Failed to create room. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.form}>
          <Text style={styles.title}>Create Room</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Room Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Birthday Party 🎉"
              value={roomName}
              onChangeText={setRoomName}
              autoFocus
              returnKeyType="next"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your IP Address</Text>
            <View style={styles.ipInputContainer}>
              <TextInput
                style={[styles.input, styles.ipInput]}
                placeholder="192.168.1.100"
                value={hostIP}
                onChangeText={setHostIP}
                keyboardType="decimal-pad"
                autoCapitalize="none"
                returnKeyType="next"
                editable={!isDetectingIP}
              />
              {isDetectingIP && <ActivityIndicator style={styles.ipLoader} size="small" />}
            </View>
            <Text style={styles.hint}>
              {isDetectingIP ? 'Detecting IP address...' : 'Enter your device\'s local IP address'}
            </Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your Name</Text>
            <TextInput
              style={styles.input}
              placeholder="John"
              value={userName}
              onChangeText={setUserName}
              returnKeyType="done"
              onSubmitEditing={handleCreateRoom}
            />
          </View>
          
          <TouchableOpacity
            style={[
              styles.button,
              (!roomName.trim() || !hostIP.trim() || !userName.trim() || isCreating) && styles.buttonDisabled,
            ]}
            onPress={handleCreateRoom}
            disabled={!roomName.trim() || !hostIP.trim() || !userName.trim() || isCreating}
          >
            {isCreating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Create Room</Text>
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
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  ipInputContainer: {
    position: 'relative',
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
  ipInput: {
    paddingRight: 48,
  },
  ipLoader: {
    position: 'absolute',
    right: 16,
    top: 14,
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
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
