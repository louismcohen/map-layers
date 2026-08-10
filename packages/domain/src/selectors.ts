import type {
	DocNode,
	Document,
	IsochroneNode,
	LayerNode,
	NodeId,
	PlaceNode,
} from './types'

export function getNode(doc: Document, id: NodeId): DocNode | undefined {
	return doc.nodes[id]
}

export function getLayer(doc: Document, id: NodeId): LayerNode | undefined {
	const node = doc.nodes[id]
	return node?.kind === 'layer' ? node : undefined
}

export function getPlace(doc: Document, id: NodeId): PlaceNode | undefined {
	const node = doc.nodes[id]
	return node?.kind === 'place' ? node : undefined
}

export function getIsochrone(doc: Document, id: NodeId): IsochroneNode | undefined {
	const node = doc.nodes[id]
	return node?.kind === 'isochrone' ? node : undefined
}

export function getParentId(doc: Document, id: NodeId): NodeId | null {
	if (doc.rootChildren.includes(id)) return null
	for (const node of Object.values(doc.nodes)) {
		if (node.kind === 'layer' && node.children.includes(id)) {
			return node.id
		}
	}
	return null
}

export function getAncestorLayerIds(doc: Document, id: NodeId): NodeId[] {
	const ancestors: NodeId[] = []
	let current = getParentId(doc, id)
	while (current) {
		ancestors.push(current)
		current = getParentId(doc, current)
	}
	return ancestors
}

/** True if this node and every ancestor layer is visible. */
export function isEffectivelyVisible(doc: Document, id: NodeId): boolean {
	const node = doc.nodes[id]
	if (!node) return false

	if (node.kind === 'layer' && !node.visible) return false
	if (node.kind === 'isochrone' && !node.visible) return false

	for (const ancestorId of getAncestorLayerIds(doc, id)) {
		const ancestor = getLayer(doc, ancestorId)
		if (!ancestor?.visible) return false
	}
	return true
}

/**
 * Nearest ancestor layer color; root-level places use document default;
 * root-level isochrones use their own color. Layers return their own color.
 */
export function getEffectiveColor(doc: Document, id: NodeId): string {
	const node = doc.nodes[id]
	if (!node) return doc.defaultPlaceColor

	if (node.kind === 'layer') return node.color

	const parentId = getParentId(doc, id)
	if (!parentId) {
		if (node.kind === 'isochrone') return node.color
		return doc.defaultPlaceColor
	}

	let current: NodeId | null = parentId
	while (current) {
		const layer = getLayer(doc, current)
		if (layer) return layer.color
		current = getParentId(doc, current)
	}
	if (node.kind === 'isochrone') return node.color
	return doc.defaultPlaceColor
}

/**
 * Pin glyph: nearest ancestor layer with `maki` set wins; otherwise the place’s
 * Search Box `maki` (may be undefined → UI default marker).
 */
export function getEffectiveMaki(doc: Document, id: NodeId): string | undefined {
	const node = doc.nodes[id]
	if (!node) return undefined

	if (node.kind === 'layer') return node.maki

	for (const ancestorId of getAncestorLayerIds(doc, id)) {
		const layer = getLayer(doc, ancestorId)
		if (layer?.maki) return layer.maki
	}

	return node.kind === 'place' ? node.maki : undefined
}

export type VisiblePlace = {
	place: PlaceNode
	color: string
	maki?: string
	parentLayerId: NodeId | null
}

export function listVisiblePlaces(doc: Document): VisiblePlace[] {
	const result: VisiblePlace[] = []
	for (const node of Object.values(doc.nodes)) {
		if (node.kind !== 'place') continue
		if (!isEffectivelyVisible(doc, node.id)) continue
		result.push({
			place: node,
			color: getEffectiveColor(doc, node.id),
			maki: getEffectiveMaki(doc, node.id),
			parentLayerId: getParentId(doc, node.id),
		})
	}
	return result
}

export type VisibleIsochrone = {
	isochrone: IsochroneNode
	color: string
	parentLayerId: NodeId | null
}

export function listVisibleIsochrones(doc: Document): VisibleIsochrone[] {
	const result: VisibleIsochrone[] = []
	for (const node of Object.values(doc.nodes)) {
		if (node.kind !== 'isochrone') continue
		if (!isEffectivelyVisible(doc, node.id)) continue
		result.push({
			isochrone: node,
			color: getEffectiveColor(doc, node.id),
			parentLayerId: getParentId(doc, node.id),
		})
	}
	return result
}

export function collectDescendantIds(doc: Document, id: NodeId): NodeId[] {
	const node = doc.nodes[id]
	if (node?.kind !== 'layer') return []
	const ids: NodeId[] = []
	for (const childId of node.children) {
		ids.push(childId)
		ids.push(...collectDescendantIds(doc, childId))
	}
	return ids
}

/** Isochrones bound to a place, in sibling-list order (same parent as the place). */
export function listAttachedIsochrones(doc: Document, placeId: NodeId): IsochroneNode[] {
	const parentId = getParentId(doc, placeId)
	const siblings =
		parentId === null ? doc.rootChildren : (getLayer(doc, parentId)?.children ?? [])
	const result: IsochroneNode[] = []
	for (const id of siblings) {
		const node = doc.nodes[id]
		if (node?.kind === 'isochrone' && node.originPlaceId === placeId) {
			result.push(node)
		}
	}
	return result
}

/** All isochrones bound to a place (any tree location). */
export function listAttachedIsochroneIds(doc: Document, placeId: NodeId): NodeId[] {
	const ids: NodeId[] = []
	for (const node of Object.values(doc.nodes)) {
		if (node.kind === 'isochrone' && node.originPlaceId === placeId) {
			ids.push(node.id)
		}
	}
	return ids
}

export function collectPlaceIdsInSubtree(doc: Document, rootId: NodeId | null): PlaceNode[] {
	const places: PlaceNode[] = []

	const walk = (ids: NodeId[]) => {
		for (const id of ids) {
			const node = doc.nodes[id]
			if (!node) continue
			if (node.kind === 'place') places.push(node)
			else if (node.kind === 'layer') walk(node.children)
		}
	}

	if (rootId === null) {
		walk(doc.rootChildren)
	} else {
		const root = doc.nodes[rootId]
		if (root?.kind === 'place') places.push(root)
		else if (root?.kind === 'layer') walk(root.children)
		// isochrones have no place children
	}
	return places
}

export function listLayers(doc: Document): LayerNode[] {
	return Object.values(doc.nodes).filter((n): n is LayerNode => n.kind === 'layer')
}

export function findExistingMapboxIds(doc: Document): Set<string> {
	const ids = new Set<string>()
	for (const node of Object.values(doc.nodes)) {
		if (node.kind === 'place') ids.add(node.mapboxId)
	}
	return ids
}

export type TreeRow = {
	id: NodeId
	depth: number
	node: DocNode
}

export type FlattenTreeOptions = {
	/** Place ids whose attached isochrones are hidden in the panel (UI-only collapse). */
	collapsedPlaceIds?: ReadonlySet<NodeId>
}

export function flattenTree(doc: Document, options?: FlattenTreeOptions): TreeRow[] {
	const rows: TreeRow[] = []
	const collapsedPlaces = options?.collapsedPlaceIds

	const nestedUnderPlace = new Set<NodeId>()
	for (const node of Object.values(doc.nodes)) {
		if (node.kind !== 'isochrone' || !node.originPlaceId) continue
		const origin = doc.nodes[node.originPlaceId]
		if (origin?.kind === 'place') nestedUnderPlace.add(node.id)
	}

	const walk = (ids: NodeId[], depth: number) => {
		for (const id of ids) {
			if (nestedUnderPlace.has(id)) continue
			const node = doc.nodes[id]
			if (!node) continue
			rows.push({ id, depth, node })
			if (node.kind === 'layer' && !node.collapsed) {
				walk(node.children, depth + 1)
			} else if (node.kind === 'place' && !collapsedPlaces?.has(id)) {
				for (const iso of listAttachedIsochrones(doc, id)) {
					rows.push({ id: iso.id, depth: depth + 1, node: iso })
				}
			}
		}
	}

	walk(doc.rootChildren, 0)
	return rows
}
