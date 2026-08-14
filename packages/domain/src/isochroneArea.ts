import type { IsochroneGeoJSON } from './types'

/** Relative polygon area in lng/lat² — enough to rank overlapping contours. */
export function isochroneArea(geojson: IsochroneGeoJSON): number {
	let total = 0
	for (const feature of geojson.features) {
		total += geometryArea(feature.geometry)
	}
	return total
}

/** Prefer the smallest contour (top of the stacked pyramid). */
export function pickSmallestIsochroneId(
	ids: Iterable<string>,
	areaById: ReadonlyMap<string, number>,
): string | null {
	let bestId: string | null = null
	let bestArea = Number.POSITIVE_INFINITY
	for (const id of ids) {
		const area = areaById.get(id)
		if (area === undefined || area >= bestArea) continue
		bestArea = area
		bestId = id
	}
	return bestId
}

function geometryArea(geometry: { type: string; coordinates: unknown }): number {
	if (geometry.type === 'Polygon') {
		return polygonArea(asRings(geometry.coordinates))
	}
	if (geometry.type === 'MultiPolygon') {
		if (!Array.isArray(geometry.coordinates)) return 0
		let total = 0
		for (const polygon of geometry.coordinates) {
			total += polygonArea(asRings(polygon))
		}
		return total
	}
	return 0
}

function asRings(value: unknown): number[][][] {
	if (!Array.isArray(value)) return []
	return value.filter(isRingList) as number[][][]
}

function isRingList(value: unknown): value is number[][] {
	return Array.isArray(value) && value.every(isPositionList)
}

function isPositionList(value: unknown): value is number[] {
	return (
		Array.isArray(value) &&
		value.length >= 2 &&
		typeof value[0] === 'number' &&
		typeof value[1] === 'number'
	)
}

function polygonArea(rings: number[][][]): number {
	if (rings.length === 0) return 0
	let area = Math.abs(ringArea(rings[0] ?? []))
	for (const hole of rings.slice(1)) {
		area -= Math.abs(ringArea(hole))
	}
	return Math.max(area, 0)
}

function ringArea(ring: number[][]): number {
	let sum = 0
	for (let i = 0; i < ring.length - 1; i++) {
		const a = ring[i]
		const b = ring[i + 1]
		const ax = a?.[0]
		const ay = a?.[1]
		const bx = b?.[0]
		const by = b?.[1]
		if (ax === undefined || ay === undefined || bx === undefined || by === undefined) {
			continue
		}
		sum += ax * by - bx * ay
	}
	return sum / 2
}
