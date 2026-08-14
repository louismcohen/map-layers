import { createId } from './document'
import {
	collectDescendantIds,
	findExistingProviderKeys,
	getLayer,
	getParentId,
	getPlace,
	listAttachedIsochroneIds,
	listAttachedIsochrones,
	placeProviderKey,
} from './selectors'
import {
	DEFAULT_PLACE_COLOR,
	type Document,
	type IsochroneDraft,
	type IsochroneMetric,
	type IsochroneNode,
	type IsochroneProfile,
	LAYER_COLOR_PALETTE,
	type LayerNode,
	metersToMiles,
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
	const id = createId('lyr')
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

export function setPlaceVisible(doc: Document, id: NodeId, visible: boolean): Document {
	const next = cloneDoc(doc)
	const place = getPlace(next, id)
	if (!place) throw new Error(`Place not found: ${id}`)
	place.visible = visible
	return next
}

export function togglePlaceVisible(doc: Document, id: NodeId): Document {
	const place = getPlace(doc, id)
	if (!place) throw new Error(`Place not found: ${id}`)
	return setPlaceVisible(doc, id, !place.visible)
}

export function setLayerColor(doc: Document, id: NodeId, color: string): Document {
	const next = cloneDoc(doc)
	const layer = getLayer(next, id)
	if (!layer) throw new Error(`Layer not found: ${id}`)
	layer.color = color
	return next
}

/** Set or clear (`undefined`) the layer’s pin glyph override (Phosphor name). */
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
	const { targetParentId } = input
	let index = input.index

	for (const id of input.ids) {
		if (!next.nodes[id]) throw new Error(`Node not found: ${id}`)
		if (wouldCreateCycle(next, id, targetParentId)) {
			throw new Error('Cannot move a layer into its own descendant')
		}
		const node = next.nodes[id]
		if (node?.kind === 'isochrone' && node.originPlaceId) {
			const origin = getPlace(next, node.originPlaceId)
			if (!origin) throw new Error('Attached isochrone missing origin place')
			const originParent = getParentId(next, node.originPlaceId)
			if (targetParentId !== originParent) {
				throw new Error('Cannot move attached isochrone away from its place')
			}
		}
	}

	// Places carry attached isochrones as a contiguous block after the place.
	const ids: NodeId[] = []
	const seen = new Set<NodeId>()
	for (const id of input.ids) {
		if (seen.has(id)) continue
		ids.push(id)
		seen.add(id)
		const node = next.nodes[id]
		if (node?.kind === 'place') {
			for (const iso of listAttachedIsochrones(next, id)) {
				if (seen.has(iso.id)) continue
				ids.push(iso.id)
				seen.add(iso.id)
			}
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

	// Places are leaves in the ownership tree; attached isochrones are siblings.
	for (const id of [...toDelete]) {
		const node = next.nodes[id]
		if (node?.kind === 'place') {
			for (const isoId of listAttachedIsochroneIds(next, id)) {
				toDelete.add(isoId)
			}
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
	skippedProviderKeys: string[]
}

export type AddPlacesInput = {
	places: PlaceDraft[]
	targetParentId?: NodeId | null
	index?: number
}

export function addPlaces(doc: Document, input: AddPlacesInput): AddPlacesResult {
	const next = cloneDoc(doc)
	const parentId = input.targetParentId === undefined ? null : input.targetParentId
	const existing = findExistingProviderKeys(next)
	const addedIds: NodeId[] = []
	const skippedProviderKeys: string[] = []
	const list = getChildList(next, parentId)
	let index = input.index ?? list.length

	for (const draft of input.places) {
		const key = placeProviderKey(draft.sourceProvider, draft.providerId)
		if (existing.has(key)) {
			skippedProviderKeys.push(key)
			continue
		}
		const id = createId('plc')
		const place: PlaceNode = {
			id,
			kind: 'place',
			name: draft.name,
			sourceProvider: draft.sourceProvider,
			providerId: draft.providerId,
			coordinates: draft.coordinates,
			address: draft.address,
			featureType: draft.featureType,
			maki: draft.maki,
			raw: draft.raw,
			visible: true,
		}
		next.nodes[id] = place
		list.splice(index, 0, id)
		index += 1
		existing.add(key)
		addedIds.push(id)
	}

	return { doc: next, addedIds, skippedProviderKeys }
}

export type AddIsochroneInput = {
	draft: IsochroneDraft
	targetParentId?: NodeId | null
	index?: number
}

export function addIsochrone(
	doc: Document,
	input: AddIsochroneInput,
): { doc: Document; id: NodeId } {
	const next = cloneDoc(doc)
	let parentId = input.targetParentId === undefined ? null : input.targetParentId
	const originPlaceId = input.draft.originPlaceId

	if (originPlaceId) {
		const place = getPlace(next, originPlaceId)
		if (!place) throw new Error(`Origin place not found: ${originPlaceId}`)
		parentId = getParentId(next, originPlaceId)
	}

	const list = getChildList(next, parentId)
	let index = input.index
	if (index === undefined && originPlaceId) {
		const placeIndex = list.indexOf(originPlaceId)
		if (placeIndex === -1) throw new Error('Origin place not in parent')
		const attached = listAttachedIsochrones(next, originPlaceId)
		if (attached.length > 0) {
			const lastId = attached[attached.length - 1]?.id
			const lastIndex = lastId ? list.indexOf(lastId) : -1
			index = lastIndex >= 0 ? lastIndex + 1 : placeIndex + 1
		} else {
			index = placeIndex + 1
		}
	} else if (index === undefined) {
		index = list.length
	}

	const id = createId('iso')
	const node: IsochroneNode = {
		id,
		kind: 'isochrone',
		name: input.draft.name,
		center: input.draft.center,
		profile: input.draft.profile,
		metric: input.draft.metric,
		contours: [...input.draft.contours],
		geojson: input.draft.geojson,
		color: input.draft.color,
		visible: input.draft.visible,
	}
	if (originPlaceId) node.originPlaceId = originPlaceId
	next.nodes[id] = node
	list.splice(index, 0, id)
	return { doc: next, id }
}

export function setIsochroneVisible(doc: Document, id: NodeId, visible: boolean): Document {
	const next = cloneDoc(doc)
	const node = next.nodes[id]
	if (node?.kind !== 'isochrone') throw new Error(`Isochrone not found: ${id}`)
	node.visible = visible
	return next
}

export function setIsochroneColor(doc: Document, id: NodeId, color: string): Document {
	const next = cloneDoc(doc)
	const node = next.nodes[id]
	if (node?.kind !== 'isochrone') throw new Error(`Isochrone not found: ${id}`)
	node.color = color
	return next
}

const PROFILE_LABEL: Record<IsochroneProfile, string> = {
	walking: 'walk',
	cycling: 'bike',
	driving: 'drive',
}

/**
 * Auto-name from contour + profile (+ optional place), e.g. `15 min walk from Main St` /
 * `1 mi bike`. Distance contours are meters.
 */
export function formatIsochroneName(
	profile: IsochroneProfile,
	metric: IsochroneMetric,
	contours: number[],
	placeName?: string | null,
): string {
	const largest = contours.length > 0 ? Math.max(...contours) : 0
	const mode = PROFILE_LABEL[profile]
	let base: string
	if (metric === 'time') {
		base = `${largest} min ${mode}`
	} else {
		const miles = metersToMiles(largest)
		const label =
			Number.isInteger(miles) || Math.abs(miles - Math.round(miles)) < 0.05
				? String(Math.round(miles))
				: miles.toFixed(1)
		base = `${label} mi ${mode}`
	}
	const from = placeName?.trim()
	return from ? `${base} from ${from}` : base
}
