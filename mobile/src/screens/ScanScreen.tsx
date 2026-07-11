import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { AppButton } from '../components/AppButton'
import type { PhotoCapture } from '../hooks/usePhotoCapture'
import { SLOT_LABELS, type Slot } from '../types'

type Props = {
  capture: PhotoCapture
  onDone: () => void
}

// The scan view: camera preview, shutter, per-shot confirmation,
// thumbnail previews with view/retake, and the Done button.
export function ScanScreen({ capture, onDone }: Props) {
  const [permission, requestPermission] = useCameraPermissions()
  const {
    cameraRef,
    photos,
    pendingUri,
    viewingSlot,
    setViewingSlot,
    retakeSlot,
    targetSlot,
    bothTaken,
    canShoot,
    takePicture,
    confirmPhoto,
    discardPhoto,
    startRetake,
  } = capture

  if (!permission) {
    return <View style={styles.container} />
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.message}>We need camera access to photograph your device</Text>
        <AppButton label="Grant permission" onPress={requestPermission} />
      </View>
    )
  }

  // Full-screen confirmation: X to discard, checkmark to keep
  if (pendingUri) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: pendingUri }} style={styles.fullImage} />
        <Text style={styles.slotLabel}>{SLOT_LABELS[targetSlot]}</Text>
        <View style={styles.confirmControls}>
          <TouchableOpacity style={styles.roundButton} onPress={discardPhoto}>
            <Text style={styles.roundButtonText}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.roundButton, styles.acceptButton]} onPress={confirmPhoto}>
            <Text style={styles.roundButtonText}>✓</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // Full-screen viewer for a taken photo, with Retake
  if (viewingSlot && photos[viewingSlot]) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photos[viewingSlot]! }} style={styles.fullImage} />
        <Text style={styles.slotLabel}>{SLOT_LABELS[viewingSlot]}</Text>
        <View style={styles.confirmControls}>
          <TouchableOpacity style={styles.roundButton} onPress={() => setViewingSlot(null)}>
            <Text style={styles.roundButtonText}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.retakeButton} onPress={() => startRetake(viewingSlot)}>
            <Text style={styles.retakeButtonText}>Retake</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      <View style={styles.controls}>
        {canShoot && (
          <Text style={styles.hint}>
            {retakeSlot
              ? `Retake the ${SLOT_LABELS[retakeSlot].toLowerCase()} photo`
              : targetSlot === 'front'
                ? 'Take a photo of the front'
                : targetSlot === 'back'
                  ? 'Take a photo of the back'
                  : 'Photograph Settings › General › About'}
          </Text>
        )}
        <View style={styles.previewRow}>
          {(['front', 'back', 'settings'] as Slot[]).map(
            (slot) =>
              photos[slot] && (
                <TouchableOpacity key={slot} onPress={() => setViewingSlot(slot)}>
                  <Image source={{ uri: photos[slot]! }} style={styles.previewBox} />
                </TouchableOpacity>
              ),
          )}
        </View>
        <View style={styles.shutterRow}>
          <TouchableOpacity
            style={[styles.shutterButton, !canShoot && styles.shutterDisabled]}
            onPress={takePicture}
            disabled={!canShoot}
          >
            <View style={styles.shutterInner} />
          </TouchableOpacity>
          {bothTaken && (
            <TouchableOpacity style={styles.doneButton} onPress={onDone}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  message: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  camera: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hint: {
    color: '#fff',
    fontSize: 15,
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 4,
  },
  previewRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    minHeight: 40,
  },
  previewBox: {
    width: 40,
    height: 40,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fff',
  },
  shutterRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterDisabled: {
    opacity: 0.35,
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
  },
  doneButton: {
    position: 'absolute',
    left: '50%',
    marginLeft: 60,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  fullImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  slotLabel: {
    position: 'absolute',
    top: 64,
    alignSelf: 'center',
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 4,
  },
  confirmControls: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
  },
  roundButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#34c759',
  },
  roundButtonText: {
    color: '#fff',
    fontSize: 28,
  },
  retakeButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    justifyContent: 'center',
    borderRadius: 32,
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
})
