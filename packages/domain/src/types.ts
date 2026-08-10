export type NodeId = string

export type PlaceNode = {
	id: NodeId
	kind: 'place'
	name: string
	mapboxId: string
	coordinates: { lng: number; lat: number }
	address?: string
	featureType?: string
	/** Mapbox Maki icon name from Search Box (e.g. restaurant, cafe). */
	maki?: string
	raw?: unknown
}

export type IsochroneProfile = 'walking' | 'cycling' | 'driving'
export type IsochroneMetric = 'time' | 'distance'

/** Minimal GeoJSON FeatureCollection stored on isochrone nodes. */
export type IsochroneGeoJSON = {
	type: 'FeatureCollection'
	features: Array<{
		type: 'Feature'
		properties?: Record<string, unknown> | null
		geometry: {
			type: string
			coordinates: unknown
		}
	}>
}

export type IsochroneNode = {
	id: NodeId
	kind: 'isochrone'
	name: string
	center: { lng: number; lat: number }
	profile: IsochroneProfile
	metric: IsochroneMetric
	/** Contour values for the API: minutes (time) or meters (distance). */
	contours: number[]
	geojson: IsochroneGeoJSON
	/** Used when node is at root; ignored for paint when under a layer. */
	color: string
	/** Own toggle; effective visibility still ANDs ancestor layers when nested. */
	visible: boolean
}

export type LayerNode = {
	id: NodeId
	kind: 'layer'
	name: string
	visible: boolean
	color: string
	/** Optional Maki icon; when set, overrides place pin glyphs under this layer. */
	maki?: string
	collapsed: boolean
	children: NodeId[]
}

export type ContentNode = PlaceNode | IsochroneNode

export type DocNode = LayerNode | ContentNode

export type Document = {
	rootChildren: NodeId[]
	nodes: Record<NodeId, DocNode>
	defaultPlaceColor: string
}

export type PlaceDraft = Omit<PlaceNode, 'id' | 'kind'>

export type IsochroneDraft = Omit<IsochroneNode, 'id' | 'kind'>

export const LAYER_COLOR_PALETTE = [
	'#da2007',
	'#ec9916',
	'#49bd0e',
	'#1f01b9',
	'#2d93ad',
	'#136f63',
	'#fbbc04',
	'#7b04fb',
	'#726e60',
	'#442b48',
] as const

export const DEFAULT_PLACE_COLOR = '#1f01b9'

/** Mapbox Isochrone max travel time (minutes). */
export const ISOCHRONE_MAX_MINUTES = 60

/** Mapbox Isochrone max distance (meters) ≈ 62.1 mi. */
export const ISOCHRONE_MAX_METERS = 100_000

export const METERS_PER_MILE = 1609.344

export function milesToMeters(miles: number): number {
	return Math.round(miles * METERS_PER_MILE)
}

export function metersToMiles(meters: number): number {
	return meters / METERS_PER_MILE
}

/** Max distance the UI may request, in miles (floored to Mapbox meters cap). */
export const ISOCHRONE_MAX_MILES = Math.floor((ISOCHRONE_MAX_METERS / METERS_PER_MILE) * 10) / 10
