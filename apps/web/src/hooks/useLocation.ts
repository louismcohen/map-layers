import { useEffect, useState } from 'react'

export type LocationState = {
	latitude: number | null
	longitude: number | null
	error: string | null
	loading: boolean
}

export function useLocation(overrideLocation?: LocationState | null): LocationState {
	const [location, setLocation] = useState<LocationState>({
		latitude: null,
		longitude: null,
		error: null,
		loading: true,
	})

	useEffect(() => {
		if (overrideLocation) return

		if (!navigator.geolocation) {
			setLocation((prev) => ({
				...prev,
				error: 'Geolocation is not supported',
				loading: false,
			}))
			return
		}

		const handleSuccess = (position: GeolocationPosition) => {
			setLocation({
				latitude: position.coords.latitude,
				longitude: position.coords.longitude,
				error: null,
				loading: false,
			})
		}

		const handleError = (error: GeolocationPositionError) =>
			setLocation((prev) => ({
				...prev,
				error: error.message,
				loading: false,
			}))

		navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
			enableHighAccuracy: true,
			timeout: 30_000,
			maximumAge: 0,
		})
	}, [overrideLocation])

	if (overrideLocation) return overrideLocation
	return location
}
