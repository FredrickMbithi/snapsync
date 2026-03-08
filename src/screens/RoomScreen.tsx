import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useAppStore } from '../store/appStore';
import { formatQRData } from '../utils/roomCode';
import SignalingManager from '../networking/signalingManager';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Room'>;
};

export default function RoomScreen({ navigation }: Props) {
  const currentRoom = useAppStore((state) => state.currentRoom);
  const members = useAppStore((state) => state.members);
  const photos = useAppStore((state) => state.photos);
  const leaveRoom = useAppStore((state) => state.leaveRoom);
  const [showQRCode, setShowQRCode] = useState(false);

  const handleLeaveRoom = () => {
    Alert.alert(
      'Leave Room',
      'Are you sure you want to leave this room?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            // Stop signaling server/client
            if (currentRoom?.isHost) {
              await SignalingManager.stopServer();
            } else {
              SignalingManager.disconnectClient();
            }
            
            leaveRoom();
            navigation.replace('Landing');
          },
        },
      ]
    );
  };

  const handleUploadPhoto = () => {
    // TODO: Implement photo picking and upload
    Alert.alert('Coming Soon', 'Photo upload will be implemented soon!');
  };

  const renderPhoto = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.photoItem}>
      <View style={styles.photoPlaceholder}>
        <Text style={styles.photoPlaceholderText}>📷</Text>
      </View>
      <View style={[styles.photoBadge, { backgroundColor: item.fromColor }]}>
        <Text style={styles.photoBadgeText}>{item.from[0]}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderMember = ({ item }: { item: any }) => (
    <View style={[styles.memberAvatar, { backgroundColor: item.color }]}>
      <Text style={styles.memberAvatarText}>{item.name[0]}</Text>
    </View>
  );

  if (!currentRoom) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.roomName}>{currentRoom.name}</Text>
          <Text style={styles.roomCode}>Code: {currentRoom.code}</Text>
          {currentRoom.isHost && currentRoom.hostIP && (
            <Text style={styles.roomCode}>IP: {currentRoom.hostIP}</Text>
          )}
        </View>
        <View style={styles.headerRight}>
          {currentRoom.isHost && (
            <TouchableOpacity
              style={styles.qrButton}
              onPress={() => setShowQRCode(true)}
            >
              <Text style={styles.qrButtonText}>QR</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.leaveButton}
            onPress={handleLeaveRoom}
          >
            <Text style={styles.leaveButtonText}>Leave</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Members */}
      <View style={styles.membersContainer}>
        <FlatList
          data={members}
          renderItem={renderMember}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.membersList}
        />
        <Text style={styles.membersCount}>
          {members.length} {members.length === 1 ? 'member' : 'members'}
        </Text>
      </View>
      
      {/* Photos */}
      <View style={styles.photosContainer}>
        {photos.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No photos yet</Text>
            <Text style={styles.emptyStateHint}>Tap + to add some!</Text>
          </View>
        ) : (
          <FlatList
            data={photos}
            renderItem={renderPhoto}
            keyExtractor={(item) => item.id}
            numColumns={3}
            contentContainerStyle={styles.photosList}
          />
        )}
      </View>
      
      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleUploadPhoto}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
      
      {/* QR Code Modal (Host Only) */}
      {currentRoom.isHost && (
        <Modal
          visible={showQRCode}
          transparent
          animationType="fade"
          onRequestClose={() => setShowQRCode(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Scan to Join</Text>
              <Text style={styles.modalSubtitle}>{currentRoom.name}</Text>
              
              <View style={styles.qrCodeContainer}>
                <QRCode
                  value={formatQRData({
                    code: currentRoom.code,
                    host: currentRoom.hostIP || '192.168.1.1',
                    port: currentRoom.port,
                    name: currentRoom.name,
                  })}
                  size={250}
                />
              </View>
              
              <View style={styles.codeDisplay}>
                <Text style={styles.codeLabel}>Manual Code:</Text>
                <Text style={styles.codeValue}>{currentRoom.code}</Text>
              </View>
              
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowQRCode(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  roomName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  roomCode: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  qrButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
  },
  qrButtonText: {
    color: '#1E40AF',
    fontSize: 14,
    fontWeight: '600',
  },
  leaveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  leaveButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
  membersContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  membersList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  membersCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  photosContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 8,
  },
  emptyStateHint: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  photosList: {
    padding: 8,
  },
  photoItem: {
    width: '33.33%',
    aspectRatio: 1,
    padding: 4,
  },
  photoPlaceholder: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 32,
  },
  photoBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  photoBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '300',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: '90%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  qrCodeContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 24,
  },
  codeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  codeLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  codeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
    letterSpacing: 2,
  },
  closeButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
