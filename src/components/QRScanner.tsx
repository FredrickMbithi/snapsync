import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors, borderRadius, spacing } from '../utils/theme';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  // Handle permissions loading
  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>📷</Text>
          <Text style={styles.permissionText}>Camera permission required to scan QR codes</Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    onScan(data);
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.topOverlay}>
            <Text style={styles.headerText}>Scan QR Code</Text>
          </View>
          <View style={styles.middleRow}>
            <View style={styles.sideOverlay} />
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <View style={styles.sideOverlay} />
          </View>
          <View style={styles.bottomOverlay}>
            <Text style={styles.instructionText}>Align the QR code within the frame</Text>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
      
      {scanned && (
        <View style={styles.scannedOverlay}>
          <Text style={styles.scannedIcon}>✓</Text>
          <Text style={styles.scannedText}>Scanned!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  permissionTitle: {
    fontSize: 48,
    marginBottom: 24,
  },
  permissionText: {
    fontSize: 18,
    color: colors.text,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 26,
  },
  button: {
    backgroundColor: colors.gold,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: borderRadius.md,
    marginBottom: 16,
  },
  buttonText: {
    color: colors.bg,
    fontSize: 16,
    fontWeight: '700',
  },
  overlay: {
    flex: 1,
  },
  topOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 12, 10, 0.75)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 32,
  },
  headerText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  middleRow: {
    flexDirection: 'row',
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 12, 10, 0.75)',
  },
  scanArea: {
    width: 260,
    height: 260,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderColor: colors.gold,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 4,
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 12, 10, 0.75)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 32,
  },
  instructionText: {
    color: colors.text2,
    fontSize: 15,
    marginBottom: 32,
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  closeButtonText: {
    color: colors.text2,
    fontSize: 16,
  },
  scannedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(14, 12, 10, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannedIcon: {
    color: colors.green,
    fontSize: 64,
    marginBottom: 16,
  },
  scannedText: {
    color: colors.green,
    fontSize: 24,
    fontWeight: '700',
  },
});
