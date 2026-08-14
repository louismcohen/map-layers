import type { IsochroneGeoJSON, IsochroneProfile } from '@map-layers/domain'
import polygonSmooth from '@turf/polygon-smooth'
import { getMapboxToken } from '@/lib/constants'
import type { IsochroneProvider, IsochroneRequest } from './types'

/** Mapbox denoise: drop small noisy contour islands (0–1). */
const DENOISE = 0.1
/** Cap Douglas–Peucker tolerance (m); higher values risk self-intersections. */
const GENERALIZE_MAX_METERS = 200
/** Turf Chaikin iterations at min / max generalize. */
const SMOOTH_ITERATIONS_MIN = 1
const SMOOTH_ITERATIONS_MAX = 3

/** Urban-ish speeds (m/min) for estimating time-contour radius. */
const SPEED_M_PER_MIN: Record<IsochroneProfile, number> = {
	walking: 83, // ~5 km/h
	cycling: 250, // ~15 km/h
	driving: 833, // ~50 km/h
}

/**
 * Fraction of estimated radius used as Mapbox `generalize` (m).
 * Calibrated: 15 min walk ≈ 5 m; 15 min drive ≈ 200 m (clamped).
 */
const GENERALIZE_FRACTION: Record<IsochroneProfile, number> = {
	walking: 0.004,
	cycling: 0.01,
	driving: 0.016,
}

/**
 * Douglas–Peucker tolerance in meters, scaled to contour size and travel mode.
 * Short walks stay detailed; typical drives keep ~200 m simplification.
 */
export function generalizeMeters(req: IsochroneRequest): number {
	const maxContour = Math.max(...req.contours)
	const radius =
		req.metric === 'distance' ? maxContour : maxContour * SPEED_M_PER_MIN[req.profile]
	return Math.min(
		GENERALIZE_MAX_METERS,
		Math.max(1, Math.round(radius * GENERALIZE_FRACTION[req.profile])),
	)
}

/**
 * Chaikin smooth passes, interpolated by how far `generalize` sits in `[1, 200]`.
 * Low generalize (detailed walk) → 1; full drive cap → 3.
 */
export function smoothIterations(req: IsochroneRequest): number {
	const t = (generalizeMeters(req) - 1) / (GENERALIZE_MAX_METERS - 1)
	return Math.min(
		SMOOTH_ITERATIONS_MAX,
		Math.max(
			SMOOTH_ITERATIONS_MIN,
			Math.round(
				SMOOTH_ITERATIONS_MIN + t * (SMOOTH_ITERATIONS_MAX - SMOOTH_ITERATIONS_MIN),
			),
		),
	)
}

export class IsochroneRequestError extends Error {
	readonly status?: number

	constructor(message: string, status?: number) {
		super(message)
		this.name = 'IsochroneRequestError'
		this.status = status
	}
}

function smoothContours(geojson: IsochroneGeoJSON, iterations: number): IsochroneGeoJSON {
	// Domain GeoJSON is intentionally loose; Mapbox returns Polygon features.
	const smoothed = polygonSmooth(geojson as Parameters<typeof polygonSmooth>[0], {
		iterations,
	})
	return smoothed as IsochroneGeoJSON
}

/** Mapbox Isochrone API — https://docs.mapbox.com/api/navigation/isochrone/ */
export const mapboxIsochroneProvider: IsochroneProvider = {
	async fetchContours(req: IsochroneRequest): Promise<IsochroneGeoJSON> {
		const token = getMapboxToken()
		if (!token) {
			throw new IsochroneRequestError('Mapbox access token is missing')
		}
		if (req.contours.length === 0 || req.contours.length > 4) {
			throw new IsochroneRequestError('Isochrone requires 1–4 contours')
		}

		const today = new Date().toISOString().split('T')[0]
		const departAt = `${today}T00:00`

		const { lng, lat } = req.center
		const url = new URL(`https://api.mapbox.com/isochrone/v1/mapbox/${req.profile}/${lng},${lat}`)
		url.searchParams.set('access_token', token)
		url.searchParams.set('polygons', 'true')
		url.searchParams.set('denoise', String(DENOISE))
		url.searchParams.set('generalize', String(generalizeMeters(req)))
		if (req.metric === 'time') {
			url.searchParams.set('contours_minutes', req.contours.join(','))
			url.searchParams.set('depart_at', departAt)
		} else {
			url.searchParams.set('contours_meters', req.contours.join(','))
		}

		const response = await fetch(url)
		if (!response.ok) {
			let detail = `Isochrone request failed (${response.status})`
			try {
				const body = (await response.json()) as { message?: string }
				if (body.message) detail = body.message
			} catch {
				// ignore parse errors
			}
			throw new IsochroneRequestError(detail, response.status)
		}

		const data = (await response.json()) as IsochroneGeoJSON
		if (data.type !== 'FeatureCollection') {
			throw new IsochroneRequestError('Unexpected isochrone response')
		}
		return smoothContours(data, smoothIterations(req))
	},
}
