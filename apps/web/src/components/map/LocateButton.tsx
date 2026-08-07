import type { MapRef } from 'react-map-gl'
import { cn } from '@/lib/cn'

type LocateButtonProps = {
	mapRef: React.RefObject<MapRef | null>
	className?: string
}

export function LocateButton({ mapRef, className }: LocateButtonProps) {
	const handleClick = () => {
		if (!navigator.geolocation) return
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				mapRef.current?.flyTo({
					center: [pos.coords.longitude, pos.coords.latitude],
					zoom: 14,
					duration: 800,
				})
			},
			() => {
				// ignore
			},
			{ enableHighAccuracy: true, maximumAge: 60_000 },
		)
	}

	return (
		<button
			type="button"
			onClick={handleClick}
			className={cn(
				'rounded-full border border-neutral-700/80 bg-neutral-900/90 px-3 py-2 text-xs font-medium text-neutral-100 shadow-lg backdrop-blur hover:bg-neutral-800',
				className,
			)}
		>
			Locate me
		</button>
	)
}
