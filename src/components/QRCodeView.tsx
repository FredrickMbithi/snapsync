import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { formatQRData } from '../utils/roomCode';

interface QRCodeViewProps {
  roomCode: string;
  roomName: string;
  hostIP: string;
  port: number;
}

export default function QRCodeView({ roomCode, roomName, hostIP, port }: QRCodeViewProps) {
  const qrData = formatQRData({
    code: roomCode,
    name: roomName,
    hostIP,
    port,
  });

  return (
    <View style={styles.container}>
      <View style={styles.qrWrapper}>
        <QRCode
          value={qrData}
          size={200}
          backgroundColor="white"
          color="black"
        />
      </View>
      <Text style={styles.infoText}>Scan to join room</Text>
      <View style={styles.detailsContainer}>
        <Text style={styles.detailLabel}>Room: {roomName}</Text>
        <Text style={styles.detailLabel}>Code: {roomCode}</Text>
        <Text style={styles.detailLabel}>Host: {hostIP}:{port}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  qrWrapper: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  detailsContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
