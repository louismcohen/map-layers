import { listVisiblePlaces } from '@map-layers/domain'
import { useEffect, useMemo, useRef } from 'react'
import type { MapRef } from 'react-map-gl'
import { Map as MapboxMap } from 'react-map-gl'
import { PlaceMarker } from '@/components/map/PlaceMarker'
import { UserLocationMarker } from '@/components/map/UserLocationMarker'
import type { LocationState } from '@/hooks/useLocation'
import { DEFAULT_CENTER, DEFAULT_ZOOM, getMapboxToken, MAP_STYLE } from '@/lib/constants'
import { useDocumentStore } from '@/store/documentStore'

type MapViewProps = {
	mapRef: React.RefObject<MapRef | null>
	userLocation: LocationState
	onMoveEnd?: () => void
}

export function MapView({ mapRef, userLocation, onMoveEnd }: MapViewProps) {
	const document = useDocumentStore((s) => s.document)
	const selectedPlaceId = useDocumentStore((s) => s.selectedPlaceId)
	const selectPlace = useDocumentStore((s) => s.selectPlace)
	const userHasInteracted = useRef(false)
	const didFlyToUser = useRef(false)

	const visiblePlaces = useMemo(() => listVisiblePlaces(document), [document])
	const searchPreview = useDocumentStore((s) => s.searchPreview)
	const toggleSearchSelection = useDocumentStore((s) => s.toggleSearchSelection)

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
		mapRef.current.flyTo({
			center: [userLocation.longitude, userLocation.latitude],
			zoom: DEFAULT_ZOOM,
			duration: 1000,
		})
	}, [userLocation.latitude, userLocation.longitude, mapRef])

	return (
		<div className="relative h-full w-full">
			<MapboxMap
				ref={mapRef}
				mapStyle={MAP_STYLE}
				mapboxAccessToken={getMapboxToken()}
				initialViewState={{
					latitude: DEFAULT_CENTER.lat,
					longitude: DEFAULT_CENTER.lng,
					zoom: DEFAULT_ZOOM,
				}}
				reuseMaps
				attributionControl={false}
				onClick={() => selectPlace(null)}
				onMoveStart={(e) => {
					if (e.originalEvent) userHasInteracted.current = true
				}}
				onMoveEnd={onMoveEnd}
				style={{ width: '100%', height: '100%' }}
			>
				{visiblePlaces.map(({ place, color }) => (
					<PlaceMarker
						key={place.id}
						id={place.id}
						latitude={place.coordinates.lat}
						longitude={place.coordinates.lng}
						color={color}
						selected={selectedPlaceId === place.id}
						onClick={selectPlace}
					/>
				))}
				{searchPreview?.results.map((result) => (
					<PlaceMarker
						key={`search-${result.mapboxId}`}
						id={result.mapboxId}
						latitude={result.coordinates.lat}
						longitude={result.coordinates.lng}
						color={searchPreview.color}
						selected={searchPreview.selectedMapboxIds.includes(result.mapboxId)}
						onClick={toggleSearchSelection}
					/>
				))}
				<UserLocationMarker userLocation={userLocation} />
			</MapboxMap>
		</div>
	)
}
