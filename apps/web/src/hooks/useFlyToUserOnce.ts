import { useEffect, useRef } from 'react'
import type { MapRef } from 'react-map-gl'
import type { LocationState } from '@/hooks/useLocation'
import { DEFAULT_ZOOM } from '@/lib/constants'
import { flyToPoint } from '@/lib/mapCamera'

/**
 * Fly once to the user's location when it becomes available,
 * unless the user has already panned/zoomed the map.
 * Returns a callback to mark user interaction (wire to map onMoveStart).
 */
export function useFlyToUserOnce(
	mapRef: React.RefObject<MapRef | null>,
	userLocation: LocationState,
) {
	const userHasInteracted = useRef(false)
	const didFlyToUser = useRef(false)

	useEffect(() => {
		if (
			didFlyToUser.current ||
			userHasInteracted.current ||
			!mapRef.current ||
			userLocation.latitude == null ||
			userLocation.longitude == null
		) {
			return
		}
		didFlyToUser.current = true
		flyToPoint(
			mapRef,
			{ lng: userLocation.longitude, lat: userLocation.latitude },
			{ zoom: DEFAULT_ZOOM, duration: 1000 },
		)
	}, [userLocation.latitude, userLocation.longitude, mapRef])

	const markUserInteracted = () => {
		userHasInteracted.current = true
	}

	return { markUserInteracted }
}
