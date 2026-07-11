import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import * as Location from 'expo-location'
import { ArrowSquareOutIcon, HandHeartIcon, MapPinIcon } from 'phosphor-react-native'
import { requestDonateLocations, type DonateLocation } from '../api'
import { RecommendationDetail } from '../components/RecommendationDetail'
import { colors, fonts, radius } from '../theme'

type Props = { blurb: string; model: string; onClose: () => void }

type LocationsState =
  | { status: 'loading' }
  | { status: 'denied' }
  | { status: 'error' }
  | { status: 'ready'; intro: string; locations: DonateLocation[] }

export function DonateScreen({ blurb, model, onClose }: Props) {
  const [state, setState] = useState<LocationsState>({ status: 'loading' })

  const load = useCallback(async () => {
    setState({ status: 'loading' })
    try {
      const permission = await Location.requestForegroundPermissionsAsync()
      if (!permission.granted) {
        setState({ status: 'denied' })
        return
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
      // Gemini searches by locality name, so turn coordinates into
      // "suburb, city, region, country" (raw coordinates as a last resort).
      const [place] = await Location.reverseGeocodeAsync(position.coords)
      const locationText =
        [place?.district, place?.city, place?.region, place?.country].filter(Boolean).join(', ') ||
        `${position.coords.latitude}, ${position.coords.longitude}`
      const data = await requestDonateLocations({
        model: model.trim() || 'tech device',
        location: locationText,
      })
      setState({ status: 'ready', ...data })
    } catch {
      setState({ status: 'error' })
    }
  }, [model])

  useEffect(() => {
    void load()
  }, [load])

  const openMaps = async (location: DonateLocation) => {
    try {
      await Linking.openURL(location.mapsUrl)
    } catch {
      Alert.alert('Couldn’t open Google Maps', `Search for "${location.name}" in your maps app.`)
    }
  }

  return (
    <RecommendationDetail title="Donate" blurb={blurb} icon={HandHeartIcon} onClose={onClose}>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Donate near you</Text>
        {state.status === 'loading' ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.pine} />
            <Text style={styles.note}>Finding donation spots near you…</Text>
          </View>
        ) : state.status === 'denied' ? (
          <Text style={styles.note}>
            Allow location access to see places near you that take donated tech.
          </Text>
        ) : state.status === 'error' ? (
          <>
            <Text style={styles.note}>Couldn’t find donation spots right now.</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Retry finding donation spots"
              style={styles.retryButton}
              onPress={() => void load()}
            >
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.intro}>{state.intro}</Text>
            <View style={styles.cards}>
              {state.locations.map((location) => (
                <TouchableOpacity
                  key={`${location.name}-${location.address}`}
                  accessibilityRole="link"
                  accessibilityLabel={`Open ${location.name} in Google Maps`}
                  activeOpacity={0.75}
                  style={styles.card}
                  onPress={() => void openMaps(location)}
                >
                  <View style={styles.cardIcon}>
                    <MapPinIcon size={20} weight="light" color={colors.pine} />
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardName}>{location.name}</Text>
                    <Text style={styles.cardAddress}>{location.address}</Text>
                    {location.note ? <Text style={styles.cardNote}>{location.note}</Text> : null}
                  </View>
                  <ArrowSquareOutIcon size={18} weight="bold" color={colors.pine} />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.mapsNote}>Each place opens in Google Maps.</Text>
          </>
        )}
      </View>
    </RecommendationDetail>
  )
}

const styles = StyleSheet.create({
  section: {
    width: '100%',
    marginTop: 28,
    paddingTop: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  sectionLabel: {
    color: colors.pine,
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  note: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: 14,
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.pineSoft,
    paddingHorizontal: 16,
  },
  retryText: {
    color: colors.pine,
    fontFamily: fonts.displaySemiBold,
    fontSize: 14,
  },
  intro: {
    color: colors.body,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  cards: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    padding: 16,
  },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.pineSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
  },
  cardName: {
    color: colors.ink,
    fontFamily: fonts.displaySemiBold,
    fontSize: 16,
    lineHeight: 21,
  },
  cardAddress: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  cardNote: {
    color: colors.body,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  mapsNote: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 12,
  },
})
