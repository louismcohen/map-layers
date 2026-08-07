import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { DocNode, NodeId } from '@map-layers/domain'
import { useEffect, useMemo, useState } from 'react'
import { MakiGlyph } from '@/components/icons/MakiGlyph'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { COLOR_PALETTE } from '@/lib/constants'
import { MAKI_ICON_NAMES } from '@/lib/makiIcon'
import { cn } from '@/lib/utils'

export type SortableRowProps = {
	node: DocNode
	id: NodeId
	depth: number
	selected: boolean
	editing: boolean
	menuOpen: boolean
	colorOpen: boolean
	iconOpen: boolean
	onSelect: () => void
	onToggleVisible: () => void
	onToggleCollapsed: () => void
	onStartEdit: () => void
	onCommitEdit: (name: string) => void
	onCancelEdit: () => void
	onMenuOpenChange: (open: boolean) => void
	onColorOpenChange: (open: boolean) => void
	onPickColor: (color: string) => void
	onIconOpenChange: (open: boolean) => void
	onPickMaki: (maki: string | undefined) => void
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
	iconOpen,
	onSelect,
	onToggleVisible,
	onToggleCollapsed,
	onStartEdit,
	onCommitEdit,
	onCancelEdit,
	onMenuOpenChange,
	onColorOpenChange,
	onPickColor,
	onIconOpenChange,
	onPickMaki,
	onUngroup,
	onDelete,
	onFit,
	onCreateSublayer,
}: SortableRowProps) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id,
	})
	const [draft, setDraft] = useState(node.name)
	const [iconFilter, setIconFilter] = useState('')

	useEffect(() => {
		if (editing) setDraft(node.name)
	}, [node.name, editing])

	useEffect(() => {
		if (!iconOpen) setIconFilter('')
	}, [iconOpen])

	const isLayer = node.kind === 'layer'
	const layerMaki = isLayer ? node.maki : undefined
	const layerColor = isLayer ? node.color : undefined

	const filteredIcons = useMemo(() => {
		const q = iconFilter.trim().toLowerCase()
		if (!q) return MAKI_ICON_NAMES
		return MAKI_ICON_NAMES.filter((name) => name.includes(q))
	}, [iconFilter])

	return (
		<li
			ref={setNodeRef}
			style={{
				transform: CSS.Transform.toString(transform),
				transition,
				paddingLeft: 8 + depth * 14,
			}}
			className={cn(
				'group relative rounded-lg',
				selected && 'bg-accent/80',
				isDragging && 'opacity-60',
			)}
		>
			<div className="flex items-center gap-1 px-1 py-1">
				<button
					type="button"
					className="cursor-grab px-0.5 text-[10px] text-muted-foreground hover:text-foreground active:cursor-grabbing"
					aria-label="Drag"
					{...attributes}
					{...listeners}
				>
					::
				</button>

				{isLayer ? (
					<button
						type="button"
						className="w-4 text-[10px] text-muted-foreground"
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
							node.visible ? 'text-foreground' : 'text-muted-foreground line-through',
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
					<Popover open={colorOpen} onOpenChange={onColorOpenChange}>
						<PopoverTrigger
							className="h-3.5 w-3.5 shrink-0 rounded-sm border border-border"
							style={{ backgroundColor: node.color }}
							aria-label="Layer color"
						/>
						<PopoverContent align="start" className="w-auto gap-1 p-2">
							<div className="grid grid-cols-5 gap-1">
								{COLOR_PALETTE.map((color) => (
									<button
										key={color}
										type="button"
										className="h-5 w-5 rounded-sm border border-border"
										style={{ backgroundColor: color }}
										onClick={() => onPickColor(color)}
										aria-label={color}
									/>
								))}
							</div>
						</PopoverContent>
					</Popover>
				) : (
					<span className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground" aria-hidden />
				)}

				{isLayer ? (
					<Popover open={iconOpen} onOpenChange={onIconOpenChange}>
						<PopoverTrigger
							className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border bg-background/60"
							aria-label="Layer icon"
							title={layerMaki ? `Icon: ${layerMaki}` : 'Set layer icon'}
						>
							<MakiGlyph maki={layerMaki} color={layerColor} className="h-3 w-3" />
						</PopoverTrigger>
						<PopoverContent align="start" className="w-56 gap-2 p-2">
							<Input
								value={iconFilter}
								onChange={(e) => setIconFilter(e.target.value)}
								placeholder="Filter icons…"
								className="h-7 text-[11px]"
							/>
							<Button
								type="button"
								variant={!layerMaki ? 'secondary' : 'ghost'}
								size="xs"
								onClick={() => onPickMaki(undefined)}
								className="w-full justify-start"
							>
								Auto (place icons)
							</Button>
							<div className="grid max-h-40 grid-cols-6 gap-1 overflow-y-auto">
								{filteredIcons.map((name) => (
									<button
										key={name}
										type="button"
										title={name}
										aria-label={name}
										onClick={() => onPickMaki(name)}
										className={cn(
											'flex h-7 w-7 items-center justify-center rounded border border-transparent hover:border-border hover:bg-accent',
											layerMaki === name && 'border-ring bg-accent',
										)}
									>
										<MakiGlyph maki={name} color={layerColor} className="h-3.5 w-3.5" />
									</button>
								))}
							</div>
						</PopoverContent>
					</Popover>
				) : null}

				{editing ? (
					<Input
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
						className="h-6 min-w-0 flex-1 rounded-md px-1 text-xs"
					/>
				) : (
					<button
						type="button"
						onClick={onSelect}
						onDoubleClick={onStartEdit}
						className="min-w-0 flex-1 truncate text-left text-xs text-foreground"
					>
						{node.name}
					</button>
				)}

				<DropdownMenu open={menuOpen} onOpenChange={onMenuOpenChange}>
					<DropdownMenuTrigger
						render={
							<Button
								type="button"
								variant="ghost"
								size="icon-xs"
								className="opacity-0 group-hover:opacity-100"
								aria-label="More"
							>
								...
							</Button>
						}
					/>
					<DropdownMenuContent align="end" className="min-w-35">
						{isLayer ? (
							<>
								<DropdownMenuItem onClick={onCreateSublayer}>New sublayer</DropdownMenuItem>
								<DropdownMenuItem onClick={onUngroup}>Ungroup</DropdownMenuItem>
							</>
						) : null}
						<DropdownMenuItem onClick={onStartEdit}>Rename</DropdownMenuItem>
						<DropdownMenuItem onClick={onFit}>Fit to map</DropdownMenuItem>
						<DropdownMenuItem variant="destructive" onClick={onDelete}>
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</li>
	)
}
