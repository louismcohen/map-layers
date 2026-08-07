import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
	collectPlaceIdsInSubtree,
	type Document,
	flattenTree,
	getParentId,
	type LayerNode,
	type NodeId,
} from '@map-layers/domain'
import { useEffect, useMemo, useState } from 'react'
import type { MapRef } from 'react-map-gl'
import { ConfirmModal, PromptModal } from '@/components/modals'
import { cn } from '@/lib/cn'
import { COLOR_PALETTE } from '@/lib/constants'
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
		if (places.length === 0 || !mapRef.current) return
		if (places.length === 1) {
			const p = places[0]
			if (!p) return
			mapRef.current.flyTo({
				center: [p.coordinates.lng, p.coordinates.lat],
				zoom: 14,
				duration: 700,
			})
			return
		}
		const lngs = places.map((p) => p.coordinates.lng)
		const lats = places.map((p) => p.coordinates.lat)
		mapRef.current.fitBounds(
			[
				[Math.min(...lngs), Math.min(...lats)],
				[Math.max(...lngs), Math.max(...lats)],
			],
			{ padding: 60, duration: 700 },
		)
	}

	const onDragEnd = (event: DragEndEvent) => {
		const { active, over } = event
		if (!over || active.id === over.id) return

		const activeId = String(active.id)
		const overId = String(over.id)
		const overNode = document.nodes[overId]
		const overParent = getParentId(document, overId)

		if (overNode?.kind === 'layer') {
			moveNodes([activeId], overId, overNode.children.length)
			return
		}

		const siblings =
			overParent === null
				? document.rootChildren
				: ((document.nodes[overParent] as LayerNode | undefined)?.children ?? [])
		const overIndex = siblings.indexOf(overId)
		moveNodes([activeId], overParent, Math.max(0, overIndex))
	}

	useEffect(() => {
		if (!selectedPlaceId) return
		const place = document.nodes[selectedPlaceId]
		if (place?.kind !== 'place') return
		mapRef.current?.flyTo({
			center: [place.coordinates.lng, place.coordinates.lat],
			zoom: Math.max(mapRef.current.getZoom(), 13),
			duration: 600,
		})
	}, [selectedPlaceId, document.nodes, mapRef])

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
										document={document}
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

type SortableRowProps = {
	document: Document
	id: NodeId
	depth: number
	selected: boolean
	editing: boolean
	menuOpen: boolean
	colorOpen: boolean
	onSelect: () => void
	onToggleVisible: () => void
	onToggleCollapsed: () => void
	onStartEdit: () => void
	onCommitEdit: (name: string) => void
	onCancelEdit: () => void
	onToggleMenu: () => void
	onToggleColor: () => void
	onPickColor: (color: string) => void
	onUngroup: () => void
	onDelete: () => void
	onFit: () => void
	onCreateSublayer: () => void
}

function SortableRow({
	document,
	id,
	depth,
	selected,
	editing,
	menuOpen,
	colorOpen,
	onSelect,
	onToggleVisible,
	onToggleCollapsed,
	onStartEdit,
	onCommitEdit,
	onCancelEdit,
	onToggleMenu,
	onToggleColor,
	onPickColor,
	onUngroup,
	onDelete,
	onFit,
	onCreateSublayer,
}: SortableRowProps) {
	const node = document.nodes[id]
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id,
	})
	const [draft, setDraft] = useState(node?.name ?? '')

	useEffect(() => {
		if (editing) setDraft(node?.name ?? '')
	}, [node?.name, editing])

	if (!node) return null

	const isLayer = node.kind === 'layer'

	return (
		<li
			ref={setNodeRef}
			style={{
				transform: CSS.Transform.toString(transform),
				transition,
				paddingLeft: 8 + depth * 14,
			}}
			className={cn(
				'group relative rounded-md',
				selected && 'bg-neutral-800/80',
				isDragging && 'opacity-60',
			)}
		>
			<div className="flex items-center gap-1 px-1 py-1">
				<button
					type="button"
					className="cursor-grab px-0.5 text-[10px] text-neutral-600 hover:text-neutral-400 active:cursor-grabbing"
					aria-label="Drag"
					{...attributes}
					{...listeners}
				>
					::
				</button>

				{isLayer ? (
					<button
						type="button"
						className="w-4 text-[10px] text-neutral-500"
						onClick={onToggleCollapsed}
						aria-label={node.collapsed ? 'Expand' : 'Collapse'}
					>
						{node.collapsed ? '>' : 'v'}
					</button>
				) : (
					<span className="w-4" />
				)}

				{isLayer ? (
					<button
						type="button"
						onClick={onToggleVisible}
						className={cn(
							'w-6 rounded text-[10px] font-medium',
							node.visible ? 'text-neutral-200' : 'text-neutral-600 line-through',
						)}
						aria-label={node.visible ? 'Hide layer' : 'Show layer'}
						title={node.visible ? 'Hide' : 'Show'}
					>
						{node.visible ? 'on' : 'off'}
					</button>
				) : (
					<span className="w-6" />
				)}

				{isLayer ? (
					<button
						type="button"
						onClick={onToggleColor}
						className="h-3.5 w-3.5 shrink-0 rounded-sm border border-white/20"
						style={{ backgroundColor: node.color }}
						aria-label="Layer color"
					/>
				) : (
					<span className="h-2 w-2 shrink-0 rounded-full bg-neutral-500" aria-hidden />
				)}

				{editing ? (
					<input
						value={draft}
						onChange={(e) => setDraft(e.target.value)}
						onBlur={() => {
							if (draft.trim()) onCommitEdit(draft)
							else onCancelEdit()
						}}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && draft.trim()) onCommitEdit(draft)
							if (e.key === 'Escape') onCancelEdit()
						}}
						className="min-w-0 flex-1 rounded border border-neutral-600 bg-neutral-950 px-1 py-0.5 text-xs text-neutral-50 outline-none"
					/>
				) : (
					<button
						type="button"
						onClick={onSelect}
						onDoubleClick={onStartEdit}
						className="min-w-0 flex-1 truncate text-left text-xs text-neutral-100"
					>
						{node.name}
					</button>
				)}

				<button
					type="button"
					onClick={onToggleMenu}
					className="rounded px-1 text-xs text-neutral-500 opacity-0 hover:bg-neutral-700 hover:text-neutral-200 group-hover:opacity-100"
					aria-label="More"
				>
					...
				</button>
			</div>

			{colorOpen && isLayer ? (
				<div className="absolute top-8 left-10 z-20 grid grid-cols-5 gap-1 rounded-md border border-neutral-700 bg-neutral-900 p-2 shadow-xl">
					{COLOR_PALETTE.map((color) => (
						<button
							key={color}
							type="button"
							className="h-5 w-5 rounded-sm border border-white/10"
							style={{ backgroundColor: color }}
							onClick={() => onPickColor(color)}
							aria-label={color}
						/>
					))}
				</div>
			) : null}

			{menuOpen ? (
				<div className="absolute top-8 right-1 z-20 min-w-[140px] rounded-md border border-neutral-700 bg-neutral-900 py-1 text-xs shadow-xl">
					{isLayer ? (
						<>
							<button
								type="button"
								className="block w-full px-3 py-1.5 text-left hover:bg-neutral-800"
								onClick={onCreateSublayer}
							>
								New sublayer
							</button>
							<button
								type="button"
								className="block w-full px-3 py-1.5 text-left hover:bg-neutral-800"
								onClick={onUngroup}
							>
								Ungroup
							</button>
						</>
					) : null}
					<button
						type="button"
						className="block w-full px-3 py-1.5 text-left hover:bg-neutral-800"
						onClick={onStartEdit}
					>
						Rename
					</button>
					<button
						type="button"
						className="block w-full px-3 py-1.5 text-left hover:bg-neutral-800"
						onClick={onFit}
					>
						Fit to map
					</button>
					<button
						type="button"
						className="block w-full px-3 py-1.5 text-left text-red-400 hover:bg-neutral-800"
						onClick={onDelete}
					>
						Delete
					</button>
				</div>
			) : null}
		</li>
	)
}
