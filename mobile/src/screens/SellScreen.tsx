import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import * as MediaLibrary from 'expo-media-library'
import type { PhoneCondition, PreviewForm, Slot } from '../types'

const MARKETPLACE_CREATE_URL = 'https://www.facebook.com/marketplace/create/item/'

const MARKETPLACE_CONDITION: Record<PhoneCondition, string> = {
  new: 'New',
  excellent: 'Used – like new',
  good: 'Used – good',
  poor: 'Used – fair',
}

type Props = {
  blurb: string
  listing: PreviewForm
  photos: Record<Slot, string | null>
  onClose: () => void
}

type ListingFieldProps = {
  label: string
  value: string
  multiline?: boolean
  copied: boolean
  onCopy: () => void
}

export function SellScreen({ blurb, listing, photos, onClose }: Props) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [photoSaveState, setPhotoSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const fields = useMemo(() => buildListingFields(listing), [listing])
  const photoUris = Object.values(photos).filter((uri): uri is string => uri !== null)

  const copy = async (label: string, value: string) => {
    await Clipboard.setStringAsync(value)
    setCopiedField(label)
    setTimeout(() => setCopiedField((current) => (current === label ? null : current)), 1600)
  }

  const copyAll = () => {
    const all = fields.map(({ label, value }) => `${label}\n${value}`).join('\n\n')
    void copy('Everything', all)
  }

  const openMarketplace = async () => {
    try {
      await Linking.openURL(MARKETPLACE_CREATE_URL)
    } catch {
      Alert.alert(
        'Couldn’t open Marketplace',
        'Open Facebook and go to Marketplace › Sell › Create listing.',
      )
    }
  }

  const savePhotos = async () => {
    if (photoSaveState !== 'idle' || photoUris.length === 0) return
    setPhotoSaveState('saving')
    try {
      const permission = await MediaLibrary.requestPermissionsAsync(true)
      if (!permission.granted) {
        setPhotoSaveState('idle')
        Alert.alert(
          'Photo access is needed',
          'Allow PocketValue to add photos so they appear in Facebook’s photo picker.',
        )
        return
      }
      await Promise.all(photoUris.map((uri) => MediaLibrary.createAssetAsync(uri)))
      setPhotoSaveState('saved')
    } catch {
      setPhotoSaveState('idle')
      Alert.alert('Couldn’t save photos', 'You can still take new photos while creating the listing.')
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Close sell listing"
          hitSlop={12}
          onPress={onClose}
        >
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Copy all listing details"
          style={styles.copyAllButton}
          onPress={copyAll}
        >
          <Text style={styles.copyAllText}>
            {copiedField === 'Everything' ? 'Copied all' : 'Copy all'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Your Marketplace listing</Text>
        <Text style={styles.intro}>
          Copy each field into Facebook. Everything is based on the device details you reviewed.
        </Text>

        <View style={styles.recommendation}>
          <Text style={styles.recommendationLabel}>WHY SELL</Text>
          <Text style={styles.recommendationText}>{blurb}</Text>
        </View>

        <View style={styles.fields}>
          {fields.map((field) => (
            <ListingField
              key={field.label}
              {...field}
              copied={copiedField === field.label}
              onCopy={() => void copy(field.label, field.value)}
            />
          ))}
        </View>

        <View style={styles.photoPrompt}>
          <View style={styles.photoPromptHeader}>
            <Text style={styles.photoIcon}>＋</Text>
            <View style={styles.photoPromptHeading}>
              <Text style={styles.photoPromptTitle}>Add a few buyer-friendly photos</Text>
              <Text style={styles.photoCount}>{photoUris.length} scan photos taken</Text>
            </View>
          </View>
          <Text style={styles.photoPromptText}>
            Save your scan photos so they appear in Facebook’s photo picker. Then add clear shots
            of the sides, ports, accessories and any scratches. More honest detail builds trust.
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Save scan photos to photo library"
            disabled={photoSaveState !== 'idle' || photoUris.length === 0}
            style={[styles.savePhotosButton, photoSaveState === 'saved' && styles.savePhotosDone]}
            onPress={() => void savePhotos()}
          >
            {photoSaveState === 'saving' ? (
              <ActivityIndicator size="small" color="#1c5b45" />
            ) : (
              <Text style={styles.savePhotosText}>
                {photoSaveState === 'saved' ? '✓ Scan photos saved' : 'Save scan photos'}
              </Text>
            )}
          </TouchableOpacity>
          <Text style={styles.privacyNote}>
            Before listing, remove personal information from the device and never show its IMEI or
            serial number publicly.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          accessibilityRole="link"
          accessibilityLabel="Go to Facebook Marketplace to create a listing"
          activeOpacity={0.82}
          style={styles.marketplaceButton}
          onPress={() => void openMarketplace()}
        >
          <Text style={styles.marketplaceButtonText}>Go to Facebook Marketplace</Text>
          <Text style={styles.arrow}>↗</Text>
        </TouchableOpacity>
        <Text style={styles.footerNote}>Facebook opens separately. You’ll review and publish there.</Text>
      </View>
    </View>
  )
}

function ListingField({ label, value, multiline, copied, onCopy }: ListingFieldProps) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Copy ${label.toLowerCase()}`}
          hitSlop={8}
          onPress={onCopy}
        >
          <Text style={[styles.copyText, copied && styles.copyTextSuccess]}>
            {copied ? 'Copied' : 'Copy'}
          </Text>
        </TouchableOpacity>
      </View>
      <Text selectable style={[styles.fieldValue, multiline && styles.fieldValueMultiline]}>
        {value}
      </Text>
    </View>
  )
}

function buildListingFields(listing: PreviewForm) {
  const model = listing.model.trim() || 'Phone'
  const storage = listing.storageGb.trim()
  const ram = listing.ramGb.trim()
  const battery = listing.batteryPct.trim()
  const condition = MARKETPLACE_CONDITION[listing.condition]
  const price = cleanPrice(listing.resaleHigh) || cleanPrice(listing.resaleLow) || 'Add your price'
  const title = [model, storage && `${storage}GB`, condition.replace('Used – ', '')]
    .filter(Boolean)
    .join(' · ')
  const specs = [
    storage && `Storage: ${storage}GB`,
    ram && `RAM: ${ram}GB`,
    battery && `Battery health: ${battery}%`,
    `Condition: ${condition}`,
  ].filter(Boolean)
  const suppliedDescription = listing.description.trim()
  const description = [
    `Selling my ${model}.`,
    '',
    ...specs.map((spec) => `• ${spec}`),
    suppliedDescription ? `\n${suppliedDescription}` : '',
    '',
    'Please message me if you would like any other photos or details.',
  ]
    .filter((line, index, lines) => line !== '' || lines[index - 1] !== '')
    .join('\n')
    .trim()

  return [
    { label: 'Title', value: title },
    { label: 'Price (AUD)', value: price === 'Add your price' ? price : `$${price}` },
    { label: 'Category', value: 'Mobile phones' },
    { label: 'Condition', value: condition },
    { label: 'Description', value: description, multiline: true },
  ]
}

function cleanPrice(value: string) {
  const price = Number(value.replace(/[^0-9.]/g, ''))
  return Number.isFinite(price) && price > 0 ? String(Math.round(price)) : ''
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0d0c',
  },
  topBar: {
    minHeight: 64,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2c302e',
  },
  closeText: {
    color: '#c8ddd2',
    fontSize: 16,
    fontWeight: '600',
  },
  copyAllButton: {
    borderRadius: 999,
    backgroundColor: '#222825',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  copyAllText: {
    color: '#f2f7f4',
    fontSize: 14,
    fontWeight: '700',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 28,
  },
  title: {
    color: '#f6f8f7',
    fontSize: 30,
    lineHeight: 35,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  intro: {
    color: '#aeb6b2',
    fontSize: 16,
    lineHeight: 23,
    marginTop: 10,
  },
  recommendation: {
    marginTop: 24,
    paddingBottom: 22,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#303532',
  },
  recommendationLabel: {
    color: '#80a894',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginBottom: 7,
  },
  recommendationText: {
    color: '#d5dbd8',
    fontSize: 15,
    lineHeight: 22,
  },
  fields: {
    gap: 12,
    marginTop: 24,
  },
  field: {
    backgroundColor: '#171a18',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#343936',
    padding: 16,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 9,
  },
  fieldLabel: {
    color: '#8e9993',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  copyText: {
    color: '#9fc8b4',
    fontSize: 14,
    fontWeight: '700',
  },
  copyTextSuccess: {
    color: '#f2f7f4',
  },
  fieldValue: {
    color: '#f2f4f3',
    fontSize: 16,
    lineHeight: 23,
  },
  fieldValueMultiline: {
    lineHeight: 24,
  },
  photoPrompt: {
    marginTop: 24,
    borderRadius: 16,
    backgroundColor: '#163629',
    padding: 18,
  },
  photoPromptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  photoIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f2f7f4',
    color: '#1c5b45',
    textAlign: 'center',
    lineHeight: 37,
    fontSize: 24,
    fontWeight: '400',
  },
  photoPromptHeading: {
    flex: 1,
  },
  photoPromptTitle: {
    color: '#f2f7f4',
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 21,
  },
  photoCount: {
    color: '#b8d2c5',
    fontSize: 13,
    marginTop: 2,
  },
  photoPromptText: {
    color: '#d3e2da',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 15,
  },
  savePhotosButton: {
    minHeight: 46,
    borderRadius: 999,
    backgroundColor: '#f2f7f4',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingHorizontal: 18,
  },
  savePhotosDone: {
    backgroundColor: '#c8ddd2',
  },
  savePhotosText: {
    color: '#1c5b45',
    fontSize: 15,
    fontWeight: '700',
  },
  privacyNote: {
    color: '#b8d2c5',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
    backgroundColor: '#0b0d0c',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#2c302e',
  },
  marketplaceButton: {
    minHeight: 54,
    borderRadius: 999,
    backgroundColor: '#1c5b45',
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  marketplaceButtonText: {
    color: '#f2f7f4',
    fontSize: 16,
    fontWeight: '700',
  },
  arrow: {
    color: '#f2f7f4',
    fontSize: 18,
    fontWeight: '700',
  },
  footerNote: {
    color: '#7f8984',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
})
