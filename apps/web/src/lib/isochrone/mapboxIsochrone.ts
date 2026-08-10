import type { IsochroneGeoJSON } from '@map-layers/domain'
import { getMapboxToken } from '@/lib/constants'
import type { IsochroneProvider, IsochroneRequest } from './types'

export class IsochroneRequestError extends Error {
	readonly status?: number

	constructor(message: string, status?: number) {
		super(message)
		this.name = 'IsochroneRequestError'
		this.status = status
	}
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
		url.searchParams.set('generalize', '200')
		if (req.metric === 'time') {
			url.searchParams.set('contours_minutes', req.contours.join(','))
			url.searchParams.set('depart_at', departAt)
		} else {
			url.searchParams.set('contours_meters', req.contours.join(','))
		}

		console.log(url.toString())

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
		return data
	},
}
