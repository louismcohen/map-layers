import type {
	DocNode,
	Document,
	IsochroneGeoJSON,
	IsochroneMetric,
	IsochroneNode,
	IsochroneProfile,
	LayerNode,
	NodeId,
	PlaceNode,
	PlaceSourceProvider,
} from '@map-layers/domain'
import type { Json } from '@/lib/database.types'
import type {
	DocumentRows,
	ExistingWorkspaceIds,
	IsochroneRow,
	LayerRow,
	PlaceRow,
	TreeNodeRow,
	WorkspaceChildRows,
	WorkspaceSnapshot,
} from './types'

export function isEmptyDocument(doc: Document): boolean {
	return Object.keys(doc.nodes).length === 0 && doc.rootChildren.length === 0
}

/** True when the client tree is empty and saving would delete every existing row. */
export function wouldWipeNonEmptyWorkspace(
	incoming: WorkspaceChildRows,
	existing: ExistingWorkspaceIds,
): boolean {
	const incomingEmpty =
		incoming.layers.length === 0 &&
		incoming.places.length === 0 &&
		incoming.isochrones.length === 0 &&
		incoming.tree_nodes.length === 0
	const existingCount =
		existing.layerIds.length +
		existing.placeIds.length +
		existing.isochroneIds.length +
		existing.treeNodeIds.length
	return incomingEmpty && existingCount > 0
}

export function rowsToDocument(snapshot: WorkspaceSnapshot): Document {
	const nodes: Record<NodeId, DocNode> = {}

	for (const row of snapshot.layers) {
		const layer: LayerNode = {
			id: row.id,
			kind: 'layer',
			name: row.name,
			visible: row.visible,
			color: row.color,
			collapsed: row.collapsed,
			children: [],
		}
		if (row.icon) layer.icon = row.icon
		nodes[row.id] = layer
	}

	for (const row of snapshot.places) {
		const place: PlaceNode = {
			id: row.id,
			kind: 'place',
			name: row.name,
			sourceProvider: asSourceProvider(row.source_provider),
			providerId: row.provider_id,
			coordinates: { lng: row.lng, lat: row.lat },
			visible: row.visible,
		}
		if (row.address) place.address = row.address
		if (row.feature_type) place.featureType = row.feature_type
		if (row.icon) place.icon = row.icon
		nodes[row.id] = place
	}

	for (const row of snapshot.isochrones) {
		const isochrone: IsochroneNode = {
			id: row.id,
			kind: 'isochrone',
			name: row.name,
			center: { lng: row.center_lng, lat: row.center_lat },
			profile: asProfile(row.profile),
			metric: asMetric(row.metric),
			contours: asContours(row.contours),
			geojson: asGeojson(row.geojson),
			color: row.color,
			visible: row.visible,
		}
		if (row.origin_place_id) isochrone.originPlaceId = row.origin_place_id
		nodes[row.id] = isochrone
	}

	const sorted = [...snapshot.tree_nodes].sort((a, b) => {
		if (a.sort_index !== b.sort_index) return a.sort_index - b.sort_index
		return a.node_id.localeCompare(b.node_id)
	})

	const byParent = new Map<string | null, string[]>()
	for (const row of sorted) {
		if (!nodes[row.node_id]) continue
		const parentKey = row.parent_id
		const list = byParent.get(parentKey) ?? []
		list.push(row.node_id)
		byParent.set(parentKey, list)
	}

	const rootChildren = byParent.get(null) ?? []
	for (const row of snapshot.layers) {
		const layer = nodes[row.id]
		if (layer?.kind !== 'layer') continue
		layer.children = byParent.get(row.id) ?? []
	}

	return {
		rootChildren,
		nodes,
		defaultPlaceColor: snapshot.workspace.default_place_color,
	}
}

export function documentToRows(doc: Document, workspaceId: string): DocumentRows {
	const layers: LayerRow[] = []
	const places: PlaceRow[] = []
	const isochrones: IsochroneRow[] = []
	const tree_nodes: TreeNodeRow[] = []

	for (const node of Object.values(doc.nodes)) {
		if (node.kind === 'layer') {
			layers.push({
				id: node.id,
				workspace_id: workspaceId,
				name: node.name,
				visible: node.visible,
				color: node.color,
				icon: node.icon ?? null,
				collapsed: node.collapsed,
			})
		} else if (node.kind === 'place') {
			places.push({
				id: node.id,
				workspace_id: workspaceId,
				name: node.name,
				source_provider: node.sourceProvider,
				provider_id: node.providerId,
				lng: node.coordinates.lng,
				lat: node.coordinates.lat,
				address: node.address ?? null,
				feature_type: node.featureType ?? null,
				icon: node.icon ?? null,
				visible: node.visible,
			})
		} else {
			isochrones.push({
				id: node.id,
				workspace_id: workspaceId,
				name: node.name,
				center_lng: node.center.lng,
				center_lat: node.center.lat,
				profile: node.profile,
				metric: node.metric,
				contours: node.contours as Json,
				geojson: node.geojson as Json,
				color: node.color,
				visible: node.visible,
				origin_place_id: node.originPlaceId ?? null,
			})
		}
	}

	walkTree(doc, workspaceId, null, doc.rootChildren, tree_nodes)

	return {
		default_place_color: doc.defaultPlaceColor,
		layers,
		places,
		isochrones,
		tree_nodes,
	}
}

function walkTree(
	doc: Document,
	workspaceId: string,
	parentId: string | null,
	childIds: NodeId[],
	tree_nodes: TreeNodeRow[],
) {
	childIds.forEach((id, sort_index) => {
		const node = doc.nodes[id]
		if (!node) return
		tree_nodes.push({
			workspace_id: workspaceId,
			node_id: id,
			kind: node.kind,
			parent_id: parentId,
			sort_index,
		})
		if (node.kind === 'layer') {
			walkTree(doc, workspaceId, id, node.children, tree_nodes)
		}
	})
}

function asSourceProvider(value: string): PlaceSourceProvider {
	if (value === 'google' || value === 'mapbox') return value
	throw new Error(`Invalid source_provider: ${value}`)
}

function asProfile(value: string): IsochroneProfile {
	if (value === 'walking' || value === 'cycling' || value === 'driving') return value
	throw new Error(`Invalid isochrone profile: ${value}`)
}

function asMetric(value: string): IsochroneMetric {
	if (value === 'time' || value === 'distance') return value
	throw new Error(`Invalid isochrone metric: ${value}`)
}

function asContours(value: Json): number[] {
	if (!Array.isArray(value) || !value.every((n) => typeof n === 'number')) {
		throw new Error('Invalid isochrone contours')
	}
	return value
}

function asGeojson(value: Json): IsochroneGeoJSON {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new Error('Invalid isochrone geojson')
	}
	const rec = value as Record<string, unknown>
	if (rec.type !== 'FeatureCollection' || !Array.isArray(rec.features)) {
		throw new Error('Invalid isochrone geojson')
	}
	return value as unknown as IsochroneGeoJSON
}
