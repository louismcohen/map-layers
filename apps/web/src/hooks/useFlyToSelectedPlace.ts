import { useEffect } from 'react'
import type { MapRef } from 'react-map-gl'
import { flyToPoint } from '@/lib/mapCamera'
import { useDocumentStore } from '@/store/documentStore'

/** Fly the map to the selected place when selection changes. */
export function useFlyToSelectedPlace(mapRef: React.RefObject<MapRef | null>) {
	const selectedPlaceId = useDocumentStore((s) => s.selectedPlaceId)
	const document = useDocumentStore((s) => s.document)

	useEffect(() => {
		if (!selectedPlaceId) return
		const place = document.nodes[selectedPlaceId]
		if (place?.kind !== 'place') return
		flyToPoint(mapRef, place.coordinates, {
			minZoom: 13,
			duration: 600,
		})
	}, [selectedPlaceId, document.nodes, mapRef])
}
