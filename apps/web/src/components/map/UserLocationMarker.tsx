import { Marker } from 'react-map-gl'
import type { LocationState } from '@/hooks/useLocation'

type UserLocationMarkerProps = {
	userLocation: LocationState
}

export function UserLocationMarker({ userLocation }: UserLocationMarkerProps) {
	if (
		userLocation.loading ||
		userLocation.error ||
		userLocation.latitude == null ||
		userLocation.longitude == null
	) {
		return null
	}

	return (
		<Marker latitude={userLocation.latitude} longitude={userLocation.longitude}>
			<div className="pop-in">
				<div className="flex h-6 w-6 rounded-full border border-neutral-950/15 shadow">
					<div className="h-full w-full rounded-full border-[3px] border-neutral-50 bg-blue-500 shadow-md" />
				</div>
			</div>
		</Marker>
	)
}
