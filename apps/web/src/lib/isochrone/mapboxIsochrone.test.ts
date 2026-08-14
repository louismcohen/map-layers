import { milesToMeters } from '@map-layers/domain'
import { describe, expect, it } from 'vitest'
import { generalizeMeters, smoothIterations } from './mapboxIsochrone'
import type { IsochroneRequest } from './types'

const center = { lng: -118.24, lat: 34.05 }

function req(
	partial: Pick<IsochroneRequest, 'profile' | 'metric' | 'contours'>,
): IsochroneRequest {
	return { center, ...partial }
}

describe('generalizeMeters', () => {
	it('keeps 15 min walks detailed (~5 m)', () => {
		expect(
			generalizeMeters(req({ profile: 'walking', metric: 'time', contours: [15] })),
		).toBe(5)
	})

	it('scales 30 min walks (~10 m)', () => {
		expect(
			generalizeMeters(req({ profile: 'walking', metric: 'time', contours: [30] })),
		).toBe(10)
	})

	it('puts cycling between walk and drive (~38 m at 15 min)', () => {
		expect(
			generalizeMeters(req({ profile: 'cycling', metric: 'time', contours: [15] })),
		).toBe(38)
	})

	it('clamps typical drives at 200 m', () => {
		expect(
			generalizeMeters(req({ profile: 'driving', metric: 'time', contours: [15] })),
		).toBe(200)
	})

	it('uses distance contour meters for a 1 mi walk (~6 m)', () => {
		expect(
			generalizeMeters(
				req({
					profile: 'walking',
					metric: 'distance',
					contours: [milesToMeters(1)],
				}),
			),
		).toBe(6)
	})

	it('keeps a 1 mi drive modest (~26 m), not the drive cap', () => {
		expect(
			generalizeMeters(
				req({
					profile: 'driving',
					metric: 'distance',
					contours: [milesToMeters(1)],
				}),
			),
		).toBe(26)
	})
})

describe('smoothIterations', () => {
	it('uses 1 pass for detailed walks (low generalize)', () => {
		expect(
			smoothIterations(req({ profile: 'walking', metric: 'time', contours: [15] })),
		).toBe(1)
	})

	it('uses 1 pass for mid cycling (generalize ~38)', () => {
		expect(
			smoothIterations(req({ profile: 'cycling', metric: 'time', contours: [15] })),
		).toBe(1)
	})

	it('uses 3 passes when generalize hits the drive cap', () => {
		expect(
			smoothIterations(req({ profile: 'driving', metric: 'time', contours: [15] })),
		).toBe(3)
	})

	it('interpolates mid-range generalize toward 2', () => {
		// ~100 m → halfway between 1 and 200 → ~2 iterations
		expect(
			smoothIterations(
				req({
					profile: 'driving',
					metric: 'distance',
					contours: [Math.round(100 / 0.016)],
				}),
			),
		).toBe(2)
	})
})
