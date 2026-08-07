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

/** v1: only PlaceNode. Future: PlaceNode | IsochroneNode | ... */
export type ContentNode = PlaceNode

export type DocNode = LayerNode | ContentNode

export type Document = {
	rootChildren: NodeId[]
	nodes: Record<NodeId, DocNode>
	defaultPlaceColor: string
}

export type PlaceDraft = Omit<PlaceNode, 'id' | 'kind'>

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
