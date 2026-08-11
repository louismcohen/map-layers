import { useCallback, useEffect, useRef } from 'react'
import type { MapRef } from 'react-map-gl'
import { useSidebar } from '@/components/ui/sidebar'

/** Matches shadcn sidebar gap width transition. */
const SIDEBAR_PADDING_DURATION_MS = 200

export type MapPadding = {
	left: number
	top: number
	right: number
	bottom: number
}

function paddingForLeft(left: number): MapPadding {
	return { left, top: 0, right: 0, bottom: 0 }
}

/**
 * Offsets the map's visual center into the clear area right of the floating
 * sidebar via Mapbox padding. flyTo / fitBounds / getCenter all respect it.
 *
 * Wire `onMapReady` to the Map `onLoad` handler — the map ref is not available
 * until then.
 */
export function useMapSidebarPadding(mapRef: React.RefObject<MapRef | null>) {
	const { open, isMobile, widthPx } = useSidebar()
	const mapReadyRef = useRef(false)
	const leftRef = useRef(0)
	const openRef = useRef(open)
	const isMobileRef = useRef(isMobile)

	const left = !isMobile && open ? widthPx : 0
	leftRef.current = left
	const mapPadding = paddingForLeft(left)

	const applyPadding = useCallback(
		(nextLeft: number, animate: boolean) => {
			const map = mapRef.current
			if (!map) return
			const padding = paddingForLeft(nextLeft)
			if (animate) {
				map.easeTo({
					padding,
					duration: SIDEBAR_PADDING_DURATION_MS,
				})
			} else {
				map.setPadding(padding)
			}
		},
		[mapRef],
	)

	const onMapReady = useCallback(() => {
		mapReadyRef.current = true
		applyPadding(leftRef.current, false)
	}, [applyPadding])

	useEffect(() => {
		if (!mapReadyRef.current) return
		const openOrMobileChanged =
			openRef.current !== open || isMobileRef.current !== isMobile
		openRef.current = open
		isMobileRef.current = isMobile
		applyPadding(left, openOrMobileChanged)
	}, [applyPadding, left, open, isMobile])

	return { mapPadding, onMapReady }
}
