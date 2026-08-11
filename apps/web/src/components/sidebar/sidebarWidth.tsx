import * as React from 'react'
import {
	clampSidebarWidth,
	SIDEBAR_WIDTH_PX,
	SIDEBAR_WIDTH_STORAGE_KEY,
} from '@/lib/constants'

export type SidebarWidthContextValue = {
	widthPx: number
	setWidthPx: (value: number | ((prev: number) => number)) => void
	isResizing: boolean
	setResizing: (resizing: boolean) => void
}

const SidebarWidthContext = React.createContext<SidebarWidthContextValue | null>(
	null,
)

export function readStoredSidebarWidth(): number {
	try {
		const raw = localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY)
		if (raw == null) return SIDEBAR_WIDTH_PX
		const n = Number(raw)
		if (!Number.isFinite(n)) return SIDEBAR_WIDTH_PX
		return clampSidebarWidth(n)
	} catch {
		return SIDEBAR_WIDTH_PX
	}
}

export function persistSidebarWidth(px: number) {
	try {
		localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(px))
	} catch {
		// ignore quota / private mode
	}
}

export function useSidebarWidth() {
	const context = React.useContext(SidebarWidthContext)
	if (!context) {
		throw new Error('useSidebarWidth must be used within AppSidebarProvider.')
	}
	return context
}

export function SidebarWidthProvider({
	children,
}: {
	children: React.ReactNode
}) {
	const [widthPx, setWidthPxState] = React.useState(readStoredSidebarWidth)
	const [isResizing, setResizing] = React.useState(false)

	const setWidthPx = React.useCallback(
		(value: number | ((prev: number) => number)) => {
			setWidthPxState((prev) => {
				const next = clampSidebarWidth(
					typeof value === 'function' ? value(prev) : value,
				)
				persistSidebarWidth(next)
				return next
			})
		},
		[],
	)

	const value = React.useMemo(
		() => ({ widthPx, setWidthPx, isResizing, setResizing }),
		[widthPx, setWidthPx, isResizing],
	)

	return (
		<SidebarWidthContext.Provider value={value}>
			{children}
		</SidebarWidthContext.Provider>
	)
}
