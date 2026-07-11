import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

type Props = {
  blurb: string
  onClose: () => void
}

// Full breakdown for the "sell" recommendation. Content is unchanged from the
// brief card view for now — this screen will get its own layout later.
export function SellScreen({ blurb, onClose }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.close} onPress={onClose}>
        <Text style={styles.closeText}>Close</Text>
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.emoji}>💸</Text>
        <Text style={styles.title}>Sell</Text>
        <Text style={styles.body}>{blurb}</Text>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  close: {
    alignSelf: 'flex-end',
    padding: 20,
  },
  closeText: {
    color: '#0a84ff',
    fontSize: 17,
    fontWeight: '600',
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 56,
    textAlign: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  body: {
    color: '#ddd',
    fontSize: 17,
    lineHeight: 26,
  },
})
