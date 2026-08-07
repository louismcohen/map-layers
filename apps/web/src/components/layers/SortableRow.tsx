import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { DocNode, NodeId } from '@map-layers/domain'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'
import { COLOR_PALETTE } from '@/lib/constants'

export type SortableRowProps = {
	node: DocNode
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

export function SortableRow({
	node,
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
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id,
	})
	const [draft, setDraft] = useState(node.name)

	useEffect(() => {
		if (editing) setDraft(node.name)
	}, [node.name, editing])

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
