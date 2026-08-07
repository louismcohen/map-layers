import type { MapRef } from 'react-map-gl'
import type { LocationState } from '@/hooks/useLocation'
import { cn } from '@/lib/cn'
import { DEFAULT_ZOOM } from '@/lib/constants'

type LocateButtonProps = {
	mapRef: React.RefObject<MapRef | null>
	userLocation: LocationState
	className?: string
}

export function LocateButton({ mapRef, userLocation, className }: LocateButtonProps) {
	const unavailable =
		userLocation.loading ||
		userLocation.error ||
		userLocation.latitude == null ||
		userLocation.longitude == null

	if (unavailable) return null

	const handleClick = () => {
		if (userLocation.latitude == null || userLocation.longitude == null) return
		mapRef.current?.flyTo({
			center: [userLocation.longitude, userLocation.latitude],
			zoom: Math.max(mapRef.current.getZoom(), DEFAULT_ZOOM),
			duration: 800,
		})
	}

	return (
		<button
			type="button"
			onClick={handleClick}
			aria-label="Go to current location"
			className={cn(
				'flex h-12 w-12 items-center justify-center rounded-full border border-neutral-950/10 bg-neutral-50/90 text-neutral-500 shadow-lg backdrop-blur hover:border-blue-500/50 hover:text-blue-500',
				className,
			)}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 512 512"
				width={20}
				height={20}
				fill="currentColor"
				aria-hidden="true"
			>
				<path d="M444.52 3.52L28.74 195.42c-47.97 22.39-31.98 92.75 19.19 92.75h175.91v175.91c0 51.17 70.36 67.17 92.75 19.19l191.9-415.78c21.39-46.37-25.56-93.32-71.97-64.97z" />
			</svg>
		</button>
	)
}
