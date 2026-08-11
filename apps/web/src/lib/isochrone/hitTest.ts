export const ISOCHRONE_FILL_LAYER_PREFIX = 'isochrone-fill-'

export function isochroneFillLayerId(id: string): string {
	return `${ISOCHRONE_FILL_LAYER_PREFIX}${id}`
}

export function isochroneIdFromFillLayerId(layerId: string): string | null {
	if (!layerId.startsWith(ISOCHRONE_FILL_LAYER_PREFIX)) return null
	return layerId.slice(ISOCHRONE_FILL_LAYER_PREFIX.length)
}
