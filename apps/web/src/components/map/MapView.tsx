import { listVisiblePlaces } from '@map-layers/domain'
import { useMemo } from 'react'
import type { MapRef } from 'react-map-gl'
import { Map as MapboxMap } from 'react-map-gl'
import { PlaceMarker } from '@/components/map/PlaceMarker'
import { DEFAULT_CENTER, DEFAULT_ZOOM, getMapboxToken, MAP_STYLE } from '@/lib/constants'
import { useDocumentStore } from '@/store/documentStore'

type MapViewProps = {
	mapRef: React.RefObject<MapRef | null>
	onMoveEnd?: () => void
}

export function MapView({ mapRef, onMoveEnd }: MapViewProps) {
	const document = useDocumentStore((s) => s.document)
	const selectedPlaceId = useDocumentStore((s) => s.selectedPlaceId)
	const selectPlace = useDocumentStore((s) => s.selectPlace)

	const visiblePlaces = useMemo(() => listVisiblePlaces(document), [document])

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
			</MapboxMap>
		</div>
	)
}
