import { DEFAULT_PLACE_COLOR, type Document } from './types'

export function createEmptyDocument(): Document {
	return {
		rootChildren: [],
		nodes: {},
		defaultPlaceColor: DEFAULT_PLACE_COLOR,
	}
}

export function createId(prefix = 'n'): string {
	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
		return `${prefix}_${crypto.randomUUID()}`
	}
	return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}
