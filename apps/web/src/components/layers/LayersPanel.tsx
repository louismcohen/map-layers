import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import {
	collectPlaceIdsInSubtree,
	flattenTree,
	type NodeId,
	resolveDropTarget,
} from '@map-layers/domain'
import { useMemo, useState } from 'react'
import type { MapRef } from 'react-map-gl'
import { SortableRow } from '@/components/layers/SortableRow'
import { ConfirmModal, PromptModal } from '@/components/modals'
import { fitToCoordinates } from '@/lib/mapCamera'
import { useDocumentStore } from '@/store/documentStore'

type LayersPanelProps = {
	mapRef: React.RefObject<MapRef | null>
}

export function LayersPanel({ mapRef }: LayersPanelProps) {
	const document = useDocumentStore((s) => s.document)
	const selectedNodeIds = useDocumentStore((s) => s.selectedNodeIds)
	const selectedPlaceId = useDocumentStore((s) => s.selectedPlaceId)
	const setSelectedNodeIds = useDocumentStore((s) => s.setSelectedNodeIds)
	const selectPlace = useDocumentStore((s) => s.selectPlace)
	const createLayer = useDocumentStore((s) => s.createLayer)
	const renameNode = useDocumentStore((s) => s.renameNode)
	const toggleLayerVisible = useDocumentStore((s) => s.toggleLayerVisible)
	const setLayerColor = useDocumentStore((s) => s.setLayerColor)
	const setLayerCollapsed = useDocumentStore((s) => s.setLayerCollapsed)
	const ungroupLayer = useDocumentStore((s) => s.ungroupLayer)
	const deleteNodes = useDocumentStore((s) => s.deleteNodes)
	const moveNodes = useDocumentStore((s) => s.moveNodes)

	const [createOpen, setCreateOpen] = useState(false)
	const [sublayerParentId, setSublayerParentId] = useState<NodeId | null>(null)
	const [deleteId, setDeleteId] = useState<NodeId | null>(null)
	const [menuId, setMenuId] = useState<NodeId | null>(null)
	const [colorPickerId, setColorPickerId] = useState<NodeId | null>(null)
	const [editingId, setEditingId] = useState<NodeId | null>(null)

	const rows = useMemo(() => flattenTree(document), [document])
	const sortableIds = rows.map((r) => r.id)

	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

	const fitToNode = (id: NodeId) => {
		const places = collectPlaceIdsInSubtree(document, id)
		fitToCoordinates(
			mapRef,
			places.map((p) => p.coordinates),
			{ padding: 60, duration: 700 },
		)
	}

	const onDragEnd = (event: DragEndEvent) => {
		const { active, over } = event
		if (!over) return

		const target = resolveDropTarget(document, String(active.id), String(over.id))
		if (!target) return
		moveNodes([String(active.id)], target.parentId, target.index)
	}

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className="flex items-center justify-between gap-2 border-b border-neutral-800 px-3 py-2">
				<h1 className="text-sm font-semibold tracking-wide text-neutral-100">Layers</h1>
				<button
					type="button"
					onClick={() => setCreateOpen(true)}
					className="rounded-md bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-900 hover:bg-white"
				>
					+ Layer
				</button>
			</div>

			<div className="min-h-0 flex-1 overflow-y-auto px-1 py-1">
				{rows.length === 0 ? (
					<p className="px-3 py-6 text-center text-xs text-neutral-500">
						No layers yet. Create a layer or search for places.
					</p>
				) : (
					<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
						<SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
							<ul className="space-y-0.5">
								{rows.map((row) => (
									<SortableRow
										key={row.id}
										node={row.node}
										id={row.id}
										depth={row.depth}
										selected={selectedNodeIds.includes(row.id) || selectedPlaceId === row.id}
										editing={editingId === row.id}
										menuOpen={menuId === row.id}
										colorOpen={colorPickerId === row.id}
										onSelect={() => {
											setSelectedNodeIds([row.id])
											if (row.node.kind === 'place') selectPlace(row.id)
											else selectPlace(null)
										}}
										onToggleVisible={() => toggleLayerVisible(row.id)}
										onToggleCollapsed={() => {
											if (row.node.kind !== 'layer') return
											setLayerCollapsed(row.id, !row.node.collapsed)
										}}
										onStartEdit={() => {
											setEditingId(row.id)
											setMenuId(null)
										}}
										onCommitEdit={(name) => {
											renameNode(row.id, name)
											setEditingId(null)
										}}
										onCancelEdit={() => setEditingId(null)}
										onToggleMenu={() => setMenuId((m) => (m === row.id ? null : row.id))}
										onToggleColor={() => setColorPickerId((c) => (c === row.id ? null : row.id))}
										onPickColor={(color) => {
											setLayerColor(row.id, color)
											setColorPickerId(null)
										}}
										onUngroup={() => {
											ungroupLayer(row.id)
											setMenuId(null)
										}}
										onDelete={() => {
											setDeleteId(row.id)
											setMenuId(null)
										}}
										onFit={() => {
											fitToNode(row.id)
											setMenuId(null)
										}}
										onCreateSublayer={() => {
											setSublayerParentId(row.id)
											setMenuId(null)
										}}
									/>
								))}
							</ul>
						</SortableContext>
					</DndContext>
				)}
			</div>

			<PromptModal
				open={createOpen}
				title="New layer"
				label="Name"
				confirmLabel="Create"
				onCancel={() => setCreateOpen(false)}
				onConfirm={(name) => {
					const parent =
						selectedNodeIds[0] && document.nodes[selectedNodeIds[0]]?.kind === 'layer'
							? selectedNodeIds[0]
							: null
					createLayer(name, parent)
					setCreateOpen(false)
				}}
			/>

			<PromptModal
				open={Boolean(sublayerParentId)}
				title="New sublayer"
				label="Name"
				confirmLabel="Create"
				onCancel={() => setSublayerParentId(null)}
				onConfirm={(name) => {
					if (sublayerParentId) createLayer(name, sublayerParentId)
					setSublayerParentId(null)
				}}
			/>

			<ConfirmModal
				open={Boolean(deleteId)}
				title="Delete"
				message="Delete this item and all nested contents? This cannot be undone."
				onCancel={() => setDeleteId(null)}
				onConfirm={() => {
					if (deleteId) deleteNodes([deleteId])
					setDeleteId(null)
				}}
			/>
		</div>
	)
}
