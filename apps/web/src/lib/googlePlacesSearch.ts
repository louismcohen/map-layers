import type { PlaceDraft } from '@map-layers/domain'
import { getGoogleMapsApiKey } from './constants'

const SEARCH_TEXT_URL = 'https://places.googleapis.com/v1/places:searchText'
const FIELD_MASK =
	'places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,nextPageToken'
const PAGE_SIZE = 20

export type SearchBounds = {
	west: number
	south: number
	east: number
	north: number
}

type SearchTextPlace = {
	id?: string
	displayName?: { text?: string }
	formattedAddress?: string
	location?: { latitude?: number; longitude?: number }
	primaryType?: string
}

type SearchTextResponse = {
	places?: SearchTextPlace[]
	nextPageToken?: string
	error?: { message?: string }
}

export type SearchTextResult = {
	drafts: PlaceDraft[]
	nextPageToken?: string
}

function toDraft(place: SearchTextPlace): PlaceDraft | null {
	const id = place.id
	const lat = place.location?.latitude
	const lng = place.location?.longitude
	if (!id || lat == null || lng == null) return null

	return {
		sourceProvider: 'google',
		providerId: id,
		name: place.displayName?.text?.trim() || 'Untitled place',
		address: place.formattedAddress,
		featureType: place.primaryType,
		coordinates: { lng, lat },
	}
}

/** Places Text Search (New) — Pro field mask; no icon on drafts. */
export async function searchText(params: {
	query: string
	bounds?: SearchBounds
	pageToken?: string
	signal?: AbortSignal
}): Promise<SearchTextResult> {
	const key = getGoogleMapsApiKey()
	if (!key || !params.query.trim()) return { drafts: [] }

	const body: Record<string, unknown> = {
		textQuery: params.query.trim(),
		pageSize: PAGE_SIZE,
		languageCode: 'en',
	}
	if (params.bounds) {
		body.locationBias = {
			rectangle: {
				low: {
					latitude: params.bounds.south,
					longitude: params.bounds.west,
				},
				high: {
					latitude: params.bounds.north,
					longitude: params.bounds.east,
				},
			},
		}
	}
	if (params.pageToken) {
		body.pageToken = params.pageToken
	}

	const response = await fetch(SEARCH_TEXT_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Goog-Api-Key': key,
			'X-Goog-FieldMask': FIELD_MASK,
		},
		body: JSON.stringify(body),
		signal: params.signal,
	})

	const data = (await response.json()) as SearchTextResponse
	if (!response.ok) {
		throw new Error(data.error?.message ?? `Search failed (${response.status})`)
	}

	const drafts: PlaceDraft[] = []
	for (const place of data.places ?? []) {
		const draft = toDraft(place)
		if (draft) drafts.push(draft)
	}

	return {
		drafts,
		nextPageToken: data.nextPageToken || undefined,
	}
}
