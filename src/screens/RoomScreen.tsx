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
import { colors, borderRadius, spacing } from '../utils/theme';

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
    <View style={styles.memberItem}>
      <View style={[styles.memberAvatar, { backgroundColor: item.color }]}>
        <Text style={styles.memberAvatarText}>{item.name[0]}</Text>
      </View>
      {item.isHost && <View style={styles.hostBadge} />}
    </View>
  );

  if (!currentRoom) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.roomName}>{currentRoom.name}</Text>
            <View style={styles.codeRow}>
              <View style={styles.codePill}>
                <Text style={styles.codePillText}>{currentRoom.code}</Text>
              </View>
              {currentRoom.isHost && (
                <TouchableOpacity
                  style={styles.qrBtn}
                  onPress={() => setShowQRCode(true)}
                >
                  <Text style={styles.qrBtnText}>📱 QR</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={styles.leaveBtn}
            onPress={handleLeaveRoom}
          >
            <Text style={styles.leaveBtnText}>Leave</Text>
          </TouchableOpacity>
        </View>
        
        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{members.length}</Text>
            <Text style={styles.statLabel}>people</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{photos.length}</Text>
            <Text style={styles.statLabel}>photos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.liveStat}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
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
      </View>
      
      {/* Photos */}
      <View style={styles.photosContainer}>
        {photos.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📷</Text>
            <Text style={styles.emptyTitle}>No photos yet</Text>
            <Text style={styles.emptySubtitle}>Tap the button below to add some!</Text>
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
      
      {/* Upload Strip */}
      <View style={styles.uploadStrip}>
        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={handleUploadPhoto}
          activeOpacity={0.8}
        >
          <Text style={styles.uploadBtnText}>+ Upload Photos</Text>
        </TouchableOpacity>
      </View>
      
      {/* QR Code Modal */}
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
                  size={220}
                  backgroundColor={colors.text}
                  color={colors.bg}
                />
              </View>
              
              <View style={styles.codeDisplay}>
                <Text style={styles.codeDisplayLabel}>CODE</Text>
                <Text style={styles.codeDisplayValue}>{currentRoom.code}</Text>
              </View>
              
              {currentRoom.hostIP && (
                <View style={styles.ipDisplay}>
                  <Text style={styles.ipDisplayLabel}>IP</Text>
                  <Text style={styles.ipDisplayValue}>{currentRoom.hostIP}</Text>
                </View>
              )}
              
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setShowQRCode(false)}
              >
                <Text style={styles.closeBtnText}>Close</Text>
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
    backgroundColor: colors.bg,
  },
  
  // Header
  header: {
    backgroundColor: colors.surface1,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  roomName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  codePill: {
    backgroundColor: colors.surface3,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  codePillText: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
  qrBtn: {
    backgroundColor: colors.surface2,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qrBtnText: {
    color: colors.text2,
    fontSize: 13,
    fontWeight: '500',
  },
  leaveBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
  },
  leaveBtnText: {
    color: colors.red,
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface2,
    gap: 20,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  liveStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.green,
    letterSpacing: 1,
  },
  
  // Members
  membersContainer: {
    backgroundColor: colors.surface1,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  membersList: {
    paddingHorizontal: spacing.lg,
    gap: 12,
  },
  memberItem: {
    position: 'relative',
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface1,
  },
  memberAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  hostBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.gold,
    borderWidth: 2,
    borderColor: colors.surface1,
  },
  
  // Photos
  photosContainer: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.text3,
    textAlign: 'center',
  },
  photosList: {
    padding: 4,
  },
  photoItem: {
    width: '33.33%',
    aspectRatio: 1,
    padding: 4,
  },
  photoPlaceholder: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 28,
  },
  photoBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface1,
  },
  photoBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  
  // Upload Strip
  uploadStrip: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.surface1,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  uploadBtn: {
    backgroundColor: colors.gold,
    paddingVertical: 16,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  uploadBtnText: {
    color: colors.bg,
    fontSize: 16,
    fontWeight: '700',
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface1,
    borderRadius: borderRadius.lg,
    padding: 28,
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 15,
    color: colors.text2,
    marginBottom: 24,
  },
  qrCodeContainer: {
    padding: 16,
    backgroundColor: colors.text,
    borderRadius: borderRadius.md,
    marginBottom: 24,
  },
  codeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  codeDisplayLabel: {
    fontSize: 11,
    color: colors.text3,
    fontWeight: '500',
    letterSpacing: 1,
  },
  codeDisplayValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.gold,
    letterSpacing: 4,
  },
  ipDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  ipDisplayLabel: {
    fontSize: 11,
    color: colors.text3,
    fontWeight: '500',
    letterSpacing: 1,
  },
  ipDisplayValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text2,
  },
  closeBtn: {
    backgroundColor: colors.surface3,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
  },
  closeBtnText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
