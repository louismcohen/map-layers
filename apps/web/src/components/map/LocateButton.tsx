import type { MapRef } from 'react-map-gl'
import { Button } from '@/components/ui/button'
import type { LocationState } from '@/hooks/useLocation'
import { DEFAULT_ZOOM } from '@/lib/constants'
import { flyToPoint } from '@/lib/mapCamera'
import { cn } from '@/lib/utils'

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
		flyToPoint(
			mapRef,
			{ lng: userLocation.longitude, lat: userLocation.latitude },
			{ minZoom: DEFAULT_ZOOM, duration: 800 },
		)
	}

	return (
		<Button
			type="button"
			variant="outline"
			size="icon-lg"
			onClick={handleClick}
			aria-label="Go to current location"
			className={cn(
				'size-12 rounded-full border-border bg-card/90 text-muted-foreground shadow-lg backdrop-blur hover:border-primary/50 hover:text-primary',
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
		</Button>
	)
}
