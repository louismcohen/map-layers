import type { PlaceDraft } from '@map-layers/domain'
import { getMapboxToken } from './constants'

type ForwardResponse = {
	features?: Array<{
		type: 'Feature'
		geometry?: {
			type: string
			coordinates: [number, number]
		}
		properties: {
			mapbox_id: string
			name: string
			full_address?: string
			place_formatted?: string
			feature_type?: string
			maki?: string
		}
	}>
}

/** Search Box forward lookup — returns coordinates in a single request. */
export async function forwardSearch(params: {
	query: string
	proximity?: { lng: number; lat: number }
	bbox?: [number, number, number, number]
	signal?: AbortSignal
}): Promise<PlaceDraft[]> {
	const token = getMapboxToken()
	if (!token || !params.query.trim()) return []

	const url = new URL('https://api.mapbox.com/search/searchbox/v1/forward')
	url.searchParams.set('q', params.query.trim())
	url.searchParams.set('access_token', token)
	url.searchParams.set('limit', '10')
	url.searchParams.set('language', 'en')
	if (params.proximity) {
		url.searchParams.set('proximity', `${params.proximity.lng},${params.proximity.lat}`)
	}
	if (params.bbox) {
		url.searchParams.set('bbox', params.bbox.join(','))
	}

	const response = await fetch(url, { signal: params.signal })
	if (!response.ok) {
		throw new Error(`Search failed (${response.status})`)
	}

	const data = (await response.json()) as ForwardResponse
	const drafts: PlaceDraft[] = []
	for (const feature of data.features ?? []) {
		if (feature.geometry?.type !== 'Point') continue
		const [lng, lat] = feature.geometry.coordinates
		drafts.push({
			sourceProvider: 'mapbox',
			providerId: feature.properties.mapbox_id,
			name: feature.properties.name,
			address: feature.properties.full_address ?? feature.properties.place_formatted,
			featureType: feature.properties.feature_type,
			icon: feature.properties.maki,
			coordinates: { lng, lat },
		})
	}

	return drafts
}
