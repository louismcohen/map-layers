import type { IsochroneGeoJSON, IsochroneMetric, IsochroneProfile } from '@map-layers/domain'

export type IsochroneRequest = {
	center: { lng: number; lat: number }
	profile: IsochroneProfile
	metric: IsochroneMetric
	contours: number[]
}

export type IsochroneProvider = {
	fetchContours(req: IsochroneRequest): Promise<IsochroneGeoJSON>
}
