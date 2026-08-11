import * as React from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { SidebarWidthProvider, useSidebarWidth } from './sidebarWidth'

type AppSidebarProviderProps = React.ComponentProps<typeof SidebarProvider>

function AppSidebarProviderInner({
	className,
	style,
	...props
}: AppSidebarProviderProps) {
	const { widthPx, isResizing } = useSidebarWidth()

	React.useEffect(() => {
		if (!isResizing) return
		const prevCursor = document.body.style.cursor
		const prevSelect = document.body.style.userSelect
		document.body.style.cursor = 'ew-resize'
		document.body.style.userSelect = 'none'
		return () => {
			document.body.style.cursor = prevCursor
			document.body.style.userSelect = prevSelect
		}
	}, [isResizing])

	return (
		<SidebarProvider
			data-resizing={isResizing ? 'true' : undefined}
			className={cn(
				'data-[resizing=true]:**:data-[slot=sidebar-container]:transition-none data-[resizing=true]:**:data-[slot=sidebar-gap]:transition-none',
				className,
			)}
			style={
				{
					...style,
					'--sidebar-width': `${widthPx}px`,
				} as React.CSSProperties
			}
			{...props}
		/>
	)
}

/** Stock shadcn `SidebarProvider` plus live width / resize state (safe to update `ui/sidebar`). */
export function AppSidebarProvider(props: AppSidebarProviderProps) {
	return (
		<SidebarWidthProvider>
			<AppSidebarProviderInner {...props} />
		</SidebarWidthProvider>
	)
}
