import { TagIcon } from 'phosphor-react-native'
import { RecommendationDetail } from '../components/RecommendationDetail'

type Props = { blurb: string; onClose: () => void }

export function SellScreen({ blurb, onClose }: Props) {
  return <RecommendationDetail title="Resell" blurb={blurb} icon={TagIcon} onClose={onClose} />
}
