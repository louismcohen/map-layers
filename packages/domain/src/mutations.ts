import { createId } from './document'
import { collectDescendantIds, findExistingMapboxIds, getLayer, getParentId } from './selectors'
import {
	DEFAULT_PLACE_COLOR,
	type Document,
	LAYER_COLOR_PALETTE,
	type LayerNode,
	type NodeId,
	type PlaceDraft,
	type PlaceNode,
} from './types'

function cloneDoc(doc: Document): Document {
	return {
		rootChildren: [...doc.rootChildren],
		defaultPlaceColor: doc.defaultPlaceColor,
		nodes: Object.fromEntries(
			Object.entries(doc.nodes).map(([id, node]) => {
				if (node.kind === 'layer') {
					return [id, { ...node, children: [...node.children] }]
				}
				return [id, { ...node }]
			}),
		),
	}
}

function getChildList(doc: Document, parentId: NodeId | null): NodeId[] {
	if (parentId === null) return doc.rootChildren
	const layer = getLayer(doc, parentId)
	if (!layer) throw new Error(`Parent layer not found: ${parentId}`)
	return layer.children
}

function removeFromParent(doc: Document, id: NodeId): number {
	const parentId = getParentId(doc, id)
	const list = getChildList(doc, parentId)
	const index = list.indexOf(id)
	if (index === -1) return -1
	list.splice(index, 1)
	return index
}

function wouldCreateCycle(doc: Document, movingId: NodeId, targetParentId: NodeId | null): boolean {
	if (targetParentId === null) return false
	if (movingId === targetParentId) return true
	const moving = doc.nodes[movingId]
	if (moving?.kind !== 'layer') return false
	const descendants = new Set(collectDescendantIds(doc, movingId))
	return descendants.has(targetParentId)
}

export function nextLayerColor(doc: Document): string {
	const used = new Set(
		Object.values(doc.nodes)
			.filter((n): n is LayerNode => n.kind === 'layer')
			.map((n) => n.color.toLowerCase()),
	)
	for (const color of LAYER_COLOR_PALETTE) {
		if (!used.has(color.toLowerCase())) return color
	}
	return LAYER_COLOR_PALETTE[doc.rootChildren.length % LAYER_COLOR_PALETTE.length] ?? '#1f01b9'
}

export function pickRandomLayerColor(): string {
	const index = Math.floor(Math.random() * LAYER_COLOR_PALETTE.length)
	return LAYER_COLOR_PALETTE[index] ?? DEFAULT_PLACE_COLOR
}

export type CreateLayerInput = {
	name: string
	parentId?: NodeId | null
	index?: number
	color?: string
}

export function createLayer(
	doc: Document,
	input: CreateLayerInput,
): { doc: Document; layerId: NodeId } {
	const name = input.name.trim()
	if (!name) throw new Error('Layer name is required')

	const next = cloneDoc(doc)
	const id = createId('layer')
	const parentId = input.parentId === undefined ? null : input.parentId
	const layer: LayerNode = {
		id,
		kind: 'layer',
		name,
		visible: true,
		color: input.color ?? nextLayerColor(next),
		collapsed: false,
		children: [],
	}
	next.nodes[id] = layer
	const list = getChildList(next, parentId)
	const index = input.index ?? list.length
	list.splice(index, 0, id)
	return { doc: next, layerId: id }
}

export function renameNode(doc: Document, id: NodeId, name: string): Document {
	const trimmed = name.trim()
	if (!trimmed) throw new Error('Name is required')
	const next = cloneDoc(doc)
	const node = next.nodes[id]
	if (!node) throw new Error(`Node not found: ${id}`)
	node.name = trimmed
	return next
}

export function setLayerVisible(doc: Document, id: NodeId, visible: boolean): Document {
	const next = cloneDoc(doc)
	const layer = getLayer(next, id)
	if (!layer) throw new Error(`Layer not found: ${id}`)
	layer.visible = visible
	return next
}

export function toggleLayerVisible(doc: Document, id: NodeId): Document {
	const layer = getLayer(doc, id)
	if (!layer) throw new Error(`Layer not found: ${id}`)
	return setLayerVisible(doc, id, !layer.visible)
}

export function setLayerColor(doc: Document, id: NodeId, color: string): Document {
	const next = cloneDoc(doc)
	const layer = getLayer(next, id)
	if (!layer) throw new Error(`Layer not found: ${id}`)
	layer.color = color
	return next
}

/** Set or clear (`undefined`) the layer’s Maki icon override. */
export function setLayerMaki(doc: Document, id: NodeId, maki: string | undefined): Document {
	const next = cloneDoc(doc)
	const layer = getLayer(next, id)
	if (!layer) throw new Error(`Layer not found: ${id}`)
	if (maki) layer.maki = maki
	else delete layer.maki
	return next
}

export function setLayerCollapsed(doc: Document, id: NodeId, collapsed: boolean): Document {
	const next = cloneDoc(doc)
	const layer = getLayer(next, id)
	if (!layer) throw new Error(`Layer not found: ${id}`)
	layer.collapsed = collapsed
	return next
}

export type MoveNodesInput = {
	ids: NodeId[]
	targetParentId: NodeId | null
	index: number
}

export function moveNodes(doc: Document, input: MoveNodesInput): Document {
	const next = cloneDoc(doc)
	const { ids, targetParentId } = input
	let index = input.index

	for (const id of ids) {
		if (!next.nodes[id]) throw new Error(`Node not found: ${id}`)
		if (wouldCreateCycle(next, id, targetParentId)) {
			throw new Error('Cannot move a layer into its own descendant')
		}
	}

	for (const id of ids) {
		const fromParent = getParentId(next, id)
		const fromList = getChildList(next, fromParent)
		const fromIndex = fromList.indexOf(id)
		if (fromIndex === -1) continue
		fromList.splice(fromIndex, 1)
		if (fromParent === targetParentId && fromIndex < index) {
			index -= 1
		}
	}

	const toList = getChildList(next, targetParentId)
	toList.splice(index, 0, ...ids)
	return next
}

export function ungroupLayer(doc: Document, id: NodeId): Document {
	const next = cloneDoc(doc)
	const layer = getLayer(next, id)
	if (!layer) throw new Error(`Layer not found: ${id}`)

	const parentId = getParentId(next, id)
	const parentList = getChildList(next, parentId)
	const index = parentList.indexOf(id)
	if (index === -1) throw new Error('Layer not in parent')

	const children = [...layer.children]
	parentList.splice(index, 1, ...children)
	delete next.nodes[id]
	return next
}

export function deleteNodes(doc: Document, ids: NodeId[]): Document {
	const next = cloneDoc(doc)
	const toDelete = new Set<NodeId>()

	for (const id of ids) {
		toDelete.add(id)
		for (const descendant of collectDescendantIds(next, id)) {
			toDelete.add(descendant)
		}
	}

	for (const id of toDelete) {
		removeFromParent(next, id)
		delete next.nodes[id]
	}

	return next
}

export type AddPlacesResult = {
	doc: Document
	addedIds: NodeId[]
	skippedMapboxIds: string[]
}

export type AddPlacesInput = {
	places: PlaceDraft[]
	targetParentId?: NodeId | null
	index?: number
}

export function addPlaces(doc: Document, input: AddPlacesInput): AddPlacesResult {
	const next = cloneDoc(doc)
	const parentId = input.targetParentId === undefined ? null : input.targetParentId
	const existing = findExistingMapboxIds(next)
	const addedIds: NodeId[] = []
	const skippedMapboxIds: string[] = []
	const list = getChildList(next, parentId)
	let index = input.index ?? list.length

	for (const draft of input.places) {
		if (existing.has(draft.mapboxId)) {
			skippedMapboxIds.push(draft.mapboxId)
			continue
		}
		const id = createId('place')
		const place: PlaceNode = {
			id,
			kind: 'place',
			name: draft.name,
			mapboxId: draft.mapboxId,
			coordinates: draft.coordinates,
			address: draft.address,
			featureType: draft.featureType,
			maki: draft.maki,
			raw: draft.raw,
		}
		next.nodes[id] = place
		list.splice(index, 0, id)
		index += 1
		existing.add(draft.mapboxId)
		addedIds.push(id)
	}

	return { doc: next, addedIds, skippedMapboxIds }
}
