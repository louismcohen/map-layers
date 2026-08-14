import { createEmptyDocument, DEFAULT_PLACE_COLOR, type Document } from '@map-layers/domain'
import { describe, expect, it } from 'vitest'
import {
	documentToRows,
	isEmptyDocument,
	rowsToDocument,
	wouldWipeNonEmptyWorkspace,
} from './mapper'
import type { WorkspaceRow } from './types'

const WORKSPACE_ID = 'wsp_test'

const workspace: WorkspaceRow = {
	id: WORKSPACE_ID,
	user_id: '00000000-0000-0000-0000-000000000001',
	default_place_color: DEFAULT_PLACE_COLOR,
	updated_at: '2026-01-01T00:00:00Z',
}

const sampleGeojson = {
	type: 'FeatureCollection' as const,
	features: [
		{
			type: 'Feature' as const,
			properties: {},
			geometry: {
				type: 'Polygon',
				coordinates: [
					[
						[0, 0],
						[1, 0],
						[1, 1],
						[0, 0],
					],
				],
			},
		},
	],
}

function sampleDocument(): Document {
	return {
		defaultPlaceColor: '#da2007',
		rootChildren: ['lyr_root', 'plc_root'],
		nodes: {
			lyr_root: {
				id: 'lyr_root',
				kind: 'layer',
				name: 'Cafes',
				visible: true,
				color: '#da2007',
				maki: 'Coffee',
				collapsed: false,
				children: ['lyr_nested', 'plc_nested', 'iso_nested'],
			},
			lyr_nested: {
				id: 'lyr_nested',
				kind: 'layer',
				name: 'Nested',
				visible: false,
				color: '#136f63',
				collapsed: true,
				children: [],
			},
			plc_nested: {
				id: 'plc_nested',
				kind: 'place',
				name: 'Blue Bottle',
				sourceProvider: 'google',
				providerId: 'ChIJabc',
				coordinates: { lng: -122.4, lat: 37.8 },
				address: '66 Mint St',
				featureType: 'cafe',
				visible: true,
				raw: { skip: 'me' },
			},
			iso_nested: {
				id: 'iso_nested',
				kind: 'isochrone',
				name: '20 min walk',
				center: { lng: -122.4, lat: 37.8 },
				profile: 'walking',
				metric: 'time',
				contours: [20],
				geojson: sampleGeojson,
				color: '#1f01b9',
				visible: true,
				originPlaceId: 'plc_nested',
			},
			plc_root: {
				id: 'plc_root',
				kind: 'place',
				name: 'City Hall',
				sourceProvider: 'mapbox',
				providerId: 'poi.1',
				coordinates: { lng: -118.2, lat: 34.0 },
				visible: false,
			},
		},
	}
}

describe('workspace mapper', () => {
	it('round-trips a nested document and drops in-memory raw', () => {
		const doc = sampleDocument()
		const rows = documentToRows(doc, WORKSPACE_ID)
		const back = rowsToDocument({
			workspace: { ...workspace, default_place_color: rows.default_place_color },
			layers: rows.layers,
			places: rows.places,
			isochrones: rows.isochrones,
			tree_nodes: rows.tree_nodes,
		})

		const expected = sampleDocument()
		const nestedPlace = expected.nodes.plc_nested
		if (nestedPlace?.kind === 'place') delete nestedPlace.raw

		expect(back).toEqual(expected)
		expect(back.nodes.plc_nested).not.toHaveProperty('raw')
	})

	it('rebuilds rootChildren and layer children from tree_nodes order', () => {
		const doc = sampleDocument()
		const rows = documentToRows(doc, WORKSPACE_ID)
		const shuffled = [...rows.tree_nodes].reverse()
		const back = rowsToDocument({
			workspace,
			layers: rows.layers,
			places: rows.places,
			isochrones: rows.isochrones,
			tree_nodes: shuffled,
		})

		expect(back.rootChildren).toEqual(['lyr_root', 'plc_root'])
		const rootLayer = back.nodes.lyr_root
		expect(rootLayer?.kind).toBe('layer')
		if (rootLayer?.kind === 'layer') {
			expect(rootLayer.children).toEqual(['lyr_nested', 'plc_nested', 'iso_nested'])
		}
	})

	it('maps lng/lat, provider fields, and origin_place_id', () => {
		const rows = documentToRows(sampleDocument(), WORKSPACE_ID)
		const place = rows.places.find((p) => p.id === 'plc_nested')
		expect(place).toMatchObject({
			lng: -122.4,
			lat: 37.8,
			source_provider: 'google',
			provider_id: 'ChIJabc',
			address: '66 Mint St',
			feature_type: 'cafe',
		})
		const iso = rows.isochrones.find((i) => i.id === 'iso_nested')
		expect(iso?.origin_place_id).toBe('plc_nested')
		expect(iso?.center_lng).toBe(-122.4)
		expect(iso?.contours).toEqual([20])
	})

	it('does not mint ids', () => {
		const rows = documentToRows(sampleDocument(), WORKSPACE_ID)
		expect(rows.layers.map((r) => r.id).sort()).toEqual(['lyr_nested', 'lyr_root'])
		expect(rows.places.map((r) => r.id).sort()).toEqual(['plc_nested', 'plc_root'])
		expect(rows.isochrones.map((r) => r.id)).toEqual(['iso_nested'])
		expect(rows.tree_nodes.map((r) => r.node_id).sort()).toEqual([
			'iso_nested',
			'lyr_nested',
			'lyr_root',
			'plc_nested',
			'plc_root',
		])
	})

	it('treats an empty document as an empty-client wipe when the server has rows', () => {
		expect(isEmptyDocument(createEmptyDocument())).toBe(true)
		const incoming = documentToRows(createEmptyDocument(), WORKSPACE_ID)
		expect(
			wouldWipeNonEmptyWorkspace(incoming, {
				layerIds: ['lyr_root'],
				placeIds: [],
				isochroneIds: [],
				treeNodeIds: ['lyr_root'],
			}),
		).toBe(true)
		expect(
			wouldWipeNonEmptyWorkspace(incoming, {
				layerIds: [],
				placeIds: [],
				isochroneIds: [],
				treeNodeIds: [],
			}),
		).toBe(false)
		expect(
			wouldWipeNonEmptyWorkspace(documentToRows(sampleDocument(), WORKSPACE_ID), {
				layerIds: ['lyr_root'],
				placeIds: ['plc_old'],
				isochroneIds: [],
				treeNodeIds: ['lyr_root', 'plc_old'],
			}),
		).toBe(false)
	})
})
