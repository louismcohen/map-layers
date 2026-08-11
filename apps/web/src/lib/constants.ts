import { LAYER_COLOR_PALETTE } from '@map-layers/domain'

export const COLOR_PALETTE = [...LAYER_COLOR_PALETTE]

export const MAP_STYLE = 'mapbox://styles/louiscohen/cm54miu4700j201qparty6veb'

export const DEFAULT_CENTER = { lat: 34.04180854391167, lng: -118.26330796874899 }
export const DEFAULT_ZOOM = 13

/** Desktop floating sidebar container width (`--sidebar-width`); includes inner `p-2`. */
export const SIDEBAR_WIDTH_PX = 360
export const SIDEBAR_WIDTH_MIN_PX = 300
export const SIDEBAR_WIDTH_MAX_PX = 520
export const SIDEBAR_WIDTH_STORAGE_KEY = 'sidebar_width'

export function clampSidebarWidth(px: number): number {
	return Math.min(SIDEBAR_WIDTH_MAX_PX, Math.max(SIDEBAR_WIDTH_MIN_PX, Math.round(px)))
}

export function getMapboxToken(): string {
	const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
	if (!token) {
		console.warn('VITE_MAPBOX_ACCESS_TOKEN is missing')
		return ''
	}
	return token
}
