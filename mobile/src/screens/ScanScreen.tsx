import { useCallback, useState, type ComponentType, type RefAttributes } from 'react'
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { CameraType, CameraView, useCameraPermissions, type CameraViewProps } from 'expo-camera'
import { CameraIcon, CheckIcon, XIcon } from 'phosphor-react-native'
import { AppButton } from '../components/AppButton'
import type { PhotoCapture } from '../hooks/usePhotoCapture'
import { SLOT_LABELS, type Slot } from '../types'
import { colors, fonts, radius } from '../theme'

// Some editor TypeScript services omit React's special JSX ref attributes for
// class-based native components. Keep the runtime component unchanged while
// making its supported instance ref explicit to those services.
const RefCameraView = CameraView as unknown as ComponentType<
  CameraViewProps & RefAttributes<CameraView>
>

// Apple's "wide angle" camera is the standard 1x rear lens. The similarly
// named "ultra wide" camera is the 0.5x lens and must not be selected here.
const NORMAL_REAR_LENS = 'builtInWideAngleCamera'

type Props = {
  capture: PhotoCapture
  onDone: () => void
}

// The scan view: camera preview, shutter, per-shot confirmation,
// thumbnail previews with view/retake, and the Done button.
export function ScanScreen({ capture, onDone }: Props) {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions()
  const [selectedLens, setSelectedLens] = useState<string | undefined>()
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

  const selectNormalRearLens = useCallback(async () => {
    if (Platform.OS !== 'ios') return

    const availableLenses = await cameraRef.current?.getAvailableLensesAsync()
    if (availableLenses?.includes(NORMAL_REAR_LENS)) {
      setSelectedLens(NORMAL_REAR_LENS)
    }
  }, [cameraRef])

  if (!permission) {
    return <View style={styles.permissionContainer} />
  }

  if (!permission.granted) {
    return (
      <View style={[styles.permissionContainer, styles.centered]}>
        <CameraIcon size={38} weight="light" color={colors.pine} />
        <Text style={styles.permissionTitle}>Camera access</Text>
        <Text style={styles.message}>PocketValue needs the camera to identify your device.</Text>
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
            <XIcon size={26} weight="bold" color={colors.ink} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.roundButton, styles.acceptButton]} onPress={confirmPhoto}>
            <CheckIcon size={26} weight="bold" color={colors.ctaText} />
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
            <XIcon size={26} weight="bold" color={colors.ink} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.retakeButton} onPress={() => startRetake(viewingSlot)}>
            <Text style={styles.retakeButtonText}>Retake</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  return (
    <View style={styles.container}>
      <RefCameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        zoom={Platform.OS === 'android' ? 0 : undefined}
        selectedLens={selectedLens}
        onCameraReady={selectNormalRearLens}
      />
      <View style={styles.controls}>
        {canShoot && (
          <Text style={styles.hint}>
            {retakeSlot
              ? `Retake the ${SLOT_LABELS[retakeSlot].toLowerCase()} photo`
              : targetSlot === 'front'
                ? 'Take a photo of the front of the device'
                : targetSlot === 'back'
                  ? 'Take a photo of the back of the device'
                  : 'Take a photo of the screen in \nSettings › General › About your Device'}
          </Text>
        )}
        {photos.front || photos.back || photos.settings ? (
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
        ) : null}
        <View style={styles.shutterRow}>
          <TouchableOpacity onPress={toggleCameraFacing}>
            <Text>Flip Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.shutterButton, !canShoot && styles.shutterDisabled]}
            onPress={takePicture}
            disabled={!canShoot}
            activeOpacity={0.72}
            accessibilityRole="button"
            accessibilityLabel="Take photo"
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
    backgroundColor: colors.ink,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  message: {
    color: colors.body,
    fontSize: 16,
    lineHeight: 25,
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: 8,
  },
  permissionTitle: {
    color: colors.ink,
    fontFamily: fonts.displaySemiBold,
    fontSize: 30,
    letterSpacing: -0.6,
  },
  camera: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    bottom: 62,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hint: {
    color: colors.ctaText,
    backgroundColor: colors.cameraOverlay,
    fontFamily: fonts.displayMedium,
    fontSize: 14,
    marginBottom: 14,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.pill,
    overflow: 'hidden',
    textAlign: 'center'
  },
  previewRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    minHeight: 40,
  },
  previewBox: {
    width: 44,
    height: 44,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.ctaText,
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
    borderWidth: 3,
    borderColor: colors.ctaText,
    backgroundColor: 'transparent',
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
    backgroundColor: colors.ctaText,
  },
  doneButton: {
    position: 'absolute',
    left: '50%',
    marginLeft: 60,
    backgroundColor: colors.pine,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  doneButtonText: {
    color: colors.ctaText,
    fontFamily: fonts.displaySemiBold,
    fontSize: 16,
  },
  fullImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  slotLabel: {
    position: 'absolute',
    top: 64,
    alignSelf: 'center',
    color: colors.ctaText,
    backgroundColor: colors.cameraOverlay,
    fontFamily: fonts.monoMedium,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    overflow: 'hidden',
    textShadowColor: colors.cameraShadow,
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
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: colors.pine,
  },
  retakeButton: {
    backgroundColor: colors.pine,
    paddingHorizontal: 24,
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  retakeButtonText: {
    color: colors.ctaText,
    fontFamily: fonts.displaySemiBold,
    fontSize: 16,
  },
})
