import type { MapRef } from 'react-map-gl'

export type MapCoordinate = { lng: number; lat: number }

export type FlyToPointOptions = {
	zoom?: number
	minZoom?: number
	duration?: number
}

export type FitToCoordinatesOptions = {
	padding?: number
	duration?: number
	/** When only one coordinate, fly instead of fitBounds. Default 14. */
	singleZoom?: number
}

export function flyToPoint(
	mapRef: React.RefObject<MapRef | null>,
	coord: MapCoordinate,
	opts: FlyToPointOptions = {},
) {
	const map = mapRef.current
	if (!map) return

	const duration = opts.duration ?? 700
	let zoom = opts.zoom
	if (zoom == null && opts.minZoom != null) {
		zoom = Math.max(map.getZoom(), opts.minZoom)
	}
	if (zoom == null) zoom = 14

	map.flyTo({
		center: [coord.lng, coord.lat],
		zoom,
		duration,
	})
}

export function fitToCoordinates(
	mapRef: React.RefObject<MapRef | null>,
	coords: MapCoordinate[],
	opts: FitToCoordinatesOptions = {},
) {
	if (!mapRef.current || coords.length === 0) return

	const padding = opts.padding ?? 80
	const duration = opts.duration ?? 700
	const singleZoom = opts.singleZoom ?? 14

	if (coords.length === 1 && coords[0]) {
		flyToPoint(mapRef, coords[0], { zoom: singleZoom, duration })
		return
	}

	const lngs = coords.map((c) => c.lng)
	const lats = coords.map((c) => c.lat)
	mapRef.current.fitBounds(
		[
			[Math.min(...lngs), Math.min(...lats)],
			[Math.max(...lngs), Math.max(...lats)],
		],
		{ padding, duration },
	)
}
