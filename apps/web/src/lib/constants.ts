import { LAYER_COLOR_PALETTE } from '@map-layers/domain'

export const COLOR_PALETTE = [...LAYER_COLOR_PALETTE]

export const MAP_STYLE = 'mapbox://styles/louiscohen/cm54miu4700j201qparty6veb'

export const DEFAULT_CENTER = { lat: 34.04180854391167, lng: -118.26330796874899 }
export const DEFAULT_ZOOM = 13

export function getMapboxToken(): string {
	const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
	if (!token) {
		console.warn('VITE_MAPBOX_ACCESS_TOKEN is missing')
		return ''
	}
	return token
}
