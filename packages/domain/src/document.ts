import { DEFAULT_PLACE_COLOR, type Document } from './types'

export function createEmptyDocument(): Document {
	return {
		rootChildren: [],
		nodes: {},
		defaultPlaceColor: DEFAULT_PLACE_COLOR,
	}
}

/** Default missing place `visible` (pre-toggle persist) to true. */
export function migratePlaceVisibility(doc: Document): Document {
	if (!doc?.nodes) return doc
	let changed = false
	const nodes = { ...doc.nodes }
	for (const [id, node] of Object.entries(nodes)) {
		if (node.kind !== 'place') continue
		const visible = (node as { visible?: boolean }).visible
		if (typeof visible === 'boolean') continue
		changed = true
		nodes[id] = { ...node, visible: true }
	}
	return changed ? { ...doc, nodes } : doc
}

/** Client-minted PK prefixes; Postgres CHECKs these. Workspace ids are minted in `ensureWorkspace` only. */
export type IdPrefix = 'wsp' | 'lyr' | 'plc' | 'iso'

export function createId(prefix: IdPrefix): string {
	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
		return `${prefix}_${crypto.randomUUID()}`
	}
	return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}
