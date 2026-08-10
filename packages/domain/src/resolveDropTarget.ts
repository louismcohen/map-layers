import { getParentId } from './selectors'
import type { Document, LayerNode, NodeId } from './types'

export type DropTarget = {
	parentId: NodeId | null
	index: number
}

function siblingTarget(
	doc: Document,
	activeId: NodeId,
	overId: NodeId,
): DropTarget {
	const overParent = getParentId(doc, overId)
	const siblings =
		overParent === null
			? doc.rootChildren
			: ((doc.nodes[overParent] as LayerNode | undefined)?.children ?? [])
	const overIndex = siblings.indexOf(overId)
	const activeIndex = siblings.indexOf(activeId)
	// moveNodes removes the active node first and decrements index when
	// fromIndex < index. Insert-before overIndex is a no-op when moving down;
	// use overIndex + 1 so the item lands at over's slot (arrayMove semantics).
	const index =
		activeIndex !== -1 && activeIndex < overIndex ? overIndex + 1 : Math.max(0, overIndex)
	return { parentId: overParent, index }
}

/**
 * Resolve a drag-over target into a parent + insert index for moveNodes.
 *
 * - Place (or other content) dropped on a layer → append as that layer's child
 * - Layer dropped on a layer → reorder as a sibling of that layer (same parent)
 * - Drop on a non-layer → insert at that row's index within its parent
 *
 * Layer-into-layer nesting is intentional via "New sublayer", not drag — dropping
 * a layer onto another layer used to nest and was too easy to do by accident,
 * with no undo.
 */
export function resolveDropTarget(
	doc: Document,
	activeId: NodeId,
	overId: NodeId,
): DropTarget | null {
	if (activeId === overId) return null

	const overNode = doc.nodes[overId]
	const activeNode = doc.nodes[activeId]
	if (!overNode || !activeNode) return null

	if (overNode.kind === 'layer' && activeNode.kind !== 'layer') {
		return { parentId: overId, index: overNode.children.length }
	}

	return siblingTarget(doc, activeId, overId)
}
