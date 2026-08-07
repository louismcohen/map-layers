import type { PlaceDraft } from '@map-layers/domain'
import { getMapboxToken } from './constants'

export type SearchSuggestion = {
	mapboxId: string
	name: string
	fullAddress?: string
	featureType?: string
	coordinates?: { lng: number; lat: number }
}

type SuggestResponse = {
	suggestions?: Array<{
		mapbox_id: string
		name: string
		full_address?: string
		place_formatted?: string
		feature_type?: string
	}>
}

type RetrieveResponse = {
	features?: Array<{
		type: 'Feature'
		geometry: {
			type: 'Point'
			coordinates: [number, number]
		}
		properties: {
			mapbox_id: string
			name: string
			full_address?: string
			place_formatted?: string
			feature_type?: string
		}
	}>
}

function sessionToken(): string {
	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
		return crypto.randomUUID()
	}
	return `${Date.now()}-${Math.random()}`
}

let activeSession = sessionToken()

export function resetSearchSession() {
	activeSession = sessionToken()
}

export async function suggestPlaces(params: {
	query: string
	proximity?: { lng: number; lat: number }
	bbox?: [number, number, number, number]
	signal?: AbortSignal
}): Promise<SearchSuggestion[]> {
	const token = getMapboxToken()
	if (!token || !params.query.trim()) return []

	const url = new URL('https://api.mapbox.com/search/searchbox/v1/suggest')
	url.searchParams.set('q', params.query.trim())
	url.searchParams.set('access_token', token)
	url.searchParams.set('session_token', activeSession)
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
	const data = (await response.json()) as SuggestResponse
	return (data.suggestions ?? []).map((s) => ({
		mapboxId: s.mapbox_id,
		name: s.name,
		fullAddress: s.full_address ?? s.place_formatted,
		featureType: s.feature_type,
	}))
}

export async function retrievePlace(mapboxId: string, signal?: AbortSignal): Promise<PlaceDraft> {
	const token = getMapboxToken()
	if (!token) throw new Error('Missing Mapbox token')

	const url = new URL(
		`https://api.mapbox.com/search/searchbox/v1/retrieve/${encodeURIComponent(mapboxId)}`,
	)
	url.searchParams.set('access_token', token)
	url.searchParams.set('session_token', activeSession)

	const response = await fetch(url, { signal })
	if (!response.ok) {
		throw new Error(`Retrieve failed (${response.status})`)
	}
	const data = (await response.json()) as RetrieveResponse
	const feature = data.features?.[0]
	if (!feature) throw new Error('No feature returned')

	const [lng, lat] = feature.geometry.coordinates
	return {
		mapboxId: feature.properties.mapbox_id,
		name: feature.properties.name,
		address: feature.properties.full_address ?? feature.properties.place_formatted,
		featureType: feature.properties.feature_type,
		coordinates: { lng, lat },
	}
}

export async function retrievePlaces(mapboxIds: string[]): Promise<PlaceDraft[]> {
	const drafts: PlaceDraft[] = []
	for (const id of mapboxIds) {
		drafts.push(await retrievePlace(id))
	}
	resetSearchSession()
	return drafts
}
