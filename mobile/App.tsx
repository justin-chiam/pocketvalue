import { useRef, useState } from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { StatusBar } from 'expo-status-bar'

type Slot = 'front' | 'back'

export default function App() {
  const [permission, requestPermission] = useCameraPermissions()
  const cameraRef = useRef<CameraView>(null)

  const [photos, setPhotos] = useState<Record<Slot, string | null>>({
    front: null,
    back: null,
  })
  // Photo waiting for X / checkmark confirmation
  const [pendingUri, setPendingUri] = useState<string | null>(null)
  // Slot being viewed full-screen after tapping its preview box
  const [viewingSlot, setViewingSlot] = useState<Slot | null>(null)
  // Slot the next confirmed shot should replace (set by "Retake")
  const [retakeSlot, setRetakeSlot] = useState<Slot | null>(null)

  if (!permission) {
    return <View style={styles.container} />
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.message}>We need camera access to photograph your device</Text>
        <TouchableOpacity style={styles.grantButton} onPress={requestPermission}>
          <Text style={styles.grantButtonText}>Grant permission</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const targetSlot: Slot = retakeSlot ?? (photos.front === null ? 'front' : 'back')
  const bothTaken = photos.front !== null && photos.back !== null

  const takePicture = async () => {
    if (!cameraRef.current) return
    const photo = await cameraRef.current.takePictureAsync()
    setPendingUri(photo.uri)
  }

  const confirmPhoto = () => {
    if (!pendingUri) return
    setPhotos((prev) => ({ ...prev, [targetSlot]: pendingUri }))
    setPendingUri(null)
    setRetakeSlot(null)
  }

  const discardPhoto = () => {
    setPendingUri(null)
  }

  const startRetake = (slot: Slot) => {
    setViewingSlot(null)
    setRetakeSlot(slot)
  }

  // Full-screen confirmation: X to discard, checkmark to keep
  if (pendingUri) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: pendingUri }} style={styles.fullImage} />
        <Text style={styles.slotLabel}>{targetSlot === 'front' ? 'Front' : 'Back'}</Text>
        <View style={styles.confirmControls}>
          <TouchableOpacity style={styles.roundButton} onPress={discardPhoto}>
            <Text style={styles.roundButtonText}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roundButton, styles.acceptButton]}
            onPress={confirmPhoto}
          >
            <Text style={styles.roundButtonText}>✓</Text>
          </TouchableOpacity>
        </View>
        <StatusBar style="light" />
      </View>
    )
  }

  // Full-screen viewer for a taken photo, with Retake
  if (viewingSlot && photos[viewingSlot]) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photos[viewingSlot]! }} style={styles.fullImage} />
        <Text style={styles.slotLabel}>{viewingSlot === 'front' ? 'Front' : 'Back'}</Text>
        <View style={styles.confirmControls}>
          <TouchableOpacity style={styles.roundButton} onPress={() => setViewingSlot(null)}>
            <Text style={styles.roundButtonText}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={() => startRetake(viewingSlot)}
          >
            <Text style={styles.retakeButtonText}>Retake</Text>
          </TouchableOpacity>
        </View>
        <StatusBar style="light" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      <View style={styles.controls}>
        {(!bothTaken || retakeSlot) && (
          <Text style={styles.hint}>
            {retakeSlot
              ? `Retake the ${retakeSlot} photo`
              : targetSlot === 'front'
                ? 'Take a photo of the front'
                : 'Take a photo of the back'}
          </Text>
        )}
        <View style={styles.previewRow}>
          {(['front', 'back'] as Slot[]).map(
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
            style={[styles.shutterButton, bothTaken && !retakeSlot && styles.shutterDisabled]}
            onPress={takePicture}
            disabled={bothTaken && !retakeSlot}
          >
            <View style={styles.shutterInner} />
          </TouchableOpacity>
          {bothTaken && (
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => console.log('Done:', photos)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <StatusBar style="light" />
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
  },
  message: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  grantButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  grantButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
