import * as React from 'react'
import { useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { useSidebarWidth } from './sidebarWidth'

const RESIZE_THRESHOLD_PX = 4

/**
 * Right-edge drag handle for the floating sidebar.
 * Uses shadcn `ResizableHandle` visuals; does not sit in `components/ui`.
 * Click without drag still toggles offcanvas.
 */
export function SidebarResizeHandle({
	className,
	...props
}: React.ComponentProps<'button'>) {
	const { toggleSidebar, state, isMobile } = useSidebar()
	const { widthPx, setWidthPx, setResizing } = useSidebarWidth()
	const dragRef = React.useRef<{
		pointerId: number
		startX: number
		startWidth: number
	} | null>(null)
	const draggedRef = React.useRef(false)

	const expanded = state === 'expanded'

	const stopTracking = React.useCallback(
		(event: React.PointerEvent<HTMLButtonElement>) => {
			if (event.currentTarget.hasPointerCapture(event.pointerId)) {
				event.currentTarget.releasePointerCapture(event.pointerId)
			}
			dragRef.current = null
			setResizing(false)
		},
		[setResizing],
	)

	return (
		<button
			type='button'
			data-slot='sidebar-resize-handle'
			aria-label={expanded ? 'Resize sidebar' : 'Toggle Sidebar'}
			tabIndex={-1}
			title={expanded ? 'Drag to resize, click to hide' : 'Toggle Sidebar'}
			onPointerDown={(event) => {
				if (isMobile || !expanded) return
				draggedRef.current = false
				event.currentTarget.setPointerCapture(event.pointerId)
				dragRef.current = {
					pointerId: event.pointerId,
					startX: event.clientX,
					startWidth: widthPx,
				}
			}}
			onPointerMove={(event) => {
				const drag = dragRef.current
				if (!drag || drag.pointerId !== event.pointerId) return
				const dx = event.clientX - drag.startX
				if (!draggedRef.current && Math.abs(dx) < RESIZE_THRESHOLD_PX) {
					return
				}
				if (!draggedRef.current) {
					draggedRef.current = true
					setResizing(true)
				}
				setWidthPx(drag.startWidth + dx)
			}}
			onPointerUp={(event) => {
				const wasDrag = draggedRef.current
				stopTracking(event)
				if (!wasDrag) toggleSidebar()
			}}
			onPointerCancel={(event) => {
				stopTracking(event)
			}}
			className={cn(
				'pointer-events-auto absolute inset-y-0 z-20 hidden w-4 touch-none group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:start-1/2 after:w-1 after:-translate-x-1/2 hover:after:bg-sidebar-border sm:flex',
				'cursor-ew-resize',
				'[[data-side=left][data-state=collapsed]_&]:cursor-e-resize',
				'group-data-[collapsible=offcanvas]:translate-x-0',
				'[[data-side=left][data-collapsible=offcanvas]_&]:-right-2',
				className,
			)}
			{...props}
		>
			{expanded && (
				<div className='pointer-events-none absolute top-1/2 left-1/2 z-10 h-6 w-1 -translate-x-1/2 -translate-y-1/2 shrink-0 rounded-lg bg-border' />
			)}
		</button>
	)
}
