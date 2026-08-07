import { getParentId } from './selectors'
import type { Document, LayerNode, NodeId } from './types'

export type DropTarget = {
	parentId: NodeId | null
	index: number
}

/**
 * Resolve a drag-over target into a parent + insert index for moveNodes.
 * Dropping on a layer appends as its last child; dropping on a sibling
 * inserts at that sibling's index within the shared parent.
 */
export function resolveDropTarget(
	doc: Document,
	activeId: NodeId,
	overId: NodeId,
): DropTarget | null {
	if (activeId === overId) return null

	const overNode = doc.nodes[overId]
	if (!overNode) return null

	if (overNode.kind === 'layer') {
		return { parentId: overId, index: overNode.children.length }
	}

	const overParent = getParentId(doc, overId)
	const siblings =
		overParent === null
			? doc.rootChildren
			: ((doc.nodes[overParent] as LayerNode | undefined)?.children ?? [])
	const overIndex = siblings.indexOf(overId)
	return { parentId: overParent, index: Math.max(0, overIndex) }
}
