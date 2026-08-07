import type { DocNode, Document, LayerNode, NodeId, PlaceNode } from './types'

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

	for (const ancestorId of getAncestorLayerIds(doc, id)) {
		const ancestor = getLayer(doc, ancestorId)
		if (!ancestor?.visible) return false
	}
	return true
}

/**
 * Nearest ancestor layer color, or document default for root-level places.
 * For a layer itself, returns its own color.
 */
export function getEffectiveColor(doc: Document, id: NodeId): string {
	const node = doc.nodes[id]
	if (!node) return doc.defaultPlaceColor

	if (node.kind === 'layer') return node.color

	const parentId = getParentId(doc, id)
	if (!parentId) return doc.defaultPlaceColor

	let current: NodeId | null = parentId
	while (current) {
		const layer = getLayer(doc, current)
		if (layer) return layer.color
		current = getParentId(doc, current)
	}
	return doc.defaultPlaceColor
}

export type VisiblePlace = {
	place: PlaceNode
	color: string
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

export function collectPlaceIdsInSubtree(doc: Document, rootId: NodeId | null): PlaceNode[] {
	const places: PlaceNode[] = []

	const walk = (ids: NodeId[]) => {
		for (const id of ids) {
			const node = doc.nodes[id]
			if (!node) continue
			if (node.kind === 'place') places.push(node)
			else walk(node.children)
		}
	}

	if (rootId === null) {
		walk(doc.rootChildren)
	} else {
		const root = doc.nodes[rootId]
		if (root?.kind === 'place') places.push(root)
		else if (root?.kind === 'layer') walk(root.children)
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

export function flattenTree(doc: Document): TreeRow[] {
	const rows: TreeRow[] = []

	const walk = (ids: NodeId[], depth: number) => {
		for (const id of ids) {
			const node = doc.nodes[id]
			if (!node) continue
			rows.push({ id, depth, node })
			if (node.kind === 'layer' && !node.collapsed) {
				walk(node.children, depth + 1)
			}
		}
	}

	walk(doc.rootChildren, 0)
	return rows
}
