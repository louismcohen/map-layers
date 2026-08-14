import type { IsochroneGeoJSON } from '@map-layers/domain'
import polygonSmooth from '@turf/polygon-smooth'
import { getMapboxToken } from '@/lib/constants'
import type { IsochroneProvider, IsochroneRequest } from './types'

/** Mapbox denoise: drop small noisy contour islands (0–1). */
const DENOISE = 0.1
/** Mapbox Douglas–Peucker tolerance in meters. */
const GENERALIZE_METERS = 5
/** Turf Chaikin corner-cutting passes after fetch. */
const SMOOTH_ITERATIONS = 1

export class IsochroneRequestError extends Error {
	readonly status?: number

	constructor(message: string, status?: number) {
		super(message)
		this.name = 'IsochroneRequestError'
		this.status = status
	}
}

function smoothContours(geojson: IsochroneGeoJSON): IsochroneGeoJSON {
	// Domain GeoJSON is intentionally loose; Mapbox returns Polygon features.
	const smoothed = polygonSmooth(geojson as Parameters<typeof polygonSmooth>[0], {
		iterations: SMOOTH_ITERATIONS,
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
		url.searchParams.set('generalize', String(GENERALIZE_METERS))
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
		return smoothContours(data)
	},
}
