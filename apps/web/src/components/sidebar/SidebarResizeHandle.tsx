import * as React from 'react';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useSidebarWidth } from './sidebarWidth';

const RESIZE_THRESHOLD_PX = 4;

/**
 * Right-edge drag handle for the floating sidebar.
 * Uses shadcn `ResizableHandle` visuals; does not sit in `components/ui`.
 * Drag only — collapse is `SidebarToggleButton` in the search header.
 */
export function SidebarResizeHandle({
    className,
    ...props
}: React.ComponentProps<'button'>) {
    const { state, isMobile } = useSidebar();
    const { widthPx, setWidthPx, setResizing } = useSidebarWidth();
    const dragRef = React.useRef<{
        pointerId: number;
        startX: number;
        startWidth: number;
    } | null>(null);
    const draggedRef = React.useRef(false);

    const expanded = state === 'expanded';

    const stopTracking = React.useCallback(
        (event: React.PointerEvent<HTMLButtonElement>) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
            }
            dragRef.current = null;
            setResizing(false);
        },
        [setResizing],
    );

    if (isMobile || !expanded) return null;

    return (
        <button
            type='button'
            data-slot='sidebar-resize-handle'
            aria-label='Resize Sidebar'
            tabIndex={-1}
            title='Drag To Resize'
            onPointerDown={(event) => {
                draggedRef.current = false;
                event.currentTarget.setPointerCapture(event.pointerId);
                dragRef.current = {
                    pointerId: event.pointerId,
                    startX: event.clientX,
                    startWidth: widthPx,
                };
            }}
            onPointerMove={(event) => {
                const drag = dragRef.current;
                if (!drag || drag.pointerId !== event.pointerId) return;
                const dx = event.clientX - drag.startX;
                if (!draggedRef.current && Math.abs(dx) < RESIZE_THRESHOLD_PX) {
                    return;
                }
                if (!draggedRef.current) {
                    draggedRef.current = true;
                    setResizing(true);
                }
                setWidthPx(drag.startWidth + dx);
            }}
            onPointerUp={(event) => {
                stopTracking(event);
            }}
            onPointerCancel={(event) => {
                stopTracking(event);
            }}
            className={cn(
                'pointer-events-auto absolute inset-y-0 z-20 hidden w-4 cursor-ew-resize touch-none group-data-[side=left]:-right-2 group-data-[side=right]:-left-2 after:absolute after:inset-y-0 after:inset-s-1/2 after:w-1 after:-translate-x-1/2 hover:after:bg-sidebar-border sm:flex',
                className,
            )}
            {...props}
        >
            <div className='pointer-events-none absolute top-1/2 left-1/2 z-10 h-6 w-1 -translate-x-1/2 -translate-y-1/2 shrink-0 rounded-lg bg-border' />
        </button>
    );
}
