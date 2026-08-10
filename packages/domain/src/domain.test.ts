import { describe, expect, it } from 'vitest'
import { createEmptyDocument } from './document'
import {
	addIsochrone,
	addPlaces,
	createLayer,
	deleteNodes,
	formatIsochroneName,
	moveNodes,
	renameNode,
	setIsochroneColor,
	setIsochroneVisible,
	setLayerColor,
	setLayerMaki,
	setLayerVisible,
	ungroupLayer,
} from './mutations'
import { resolveDropTarget } from './resolveDropTarget'
import {
	getEffectiveColor,
	getEffectiveMaki,
	getParentId,
	isEffectivelyVisible,
	listVisibleIsochrones,
	listVisiblePlaces,
} from './selectors'
import type { IsochroneGeoJSON } from './types'
import { milesToMeters } from './types'

describe('domain tree', () => {
	it('creates layers and places with effective color/visibility', () => {
		let doc = createEmptyDocument()
		const { doc: withLayer, layerId } = createLayer(doc, { name: 'Cafes', color: '#da2007' })
		doc = withLayer

		const added = addPlaces(doc, {
			targetParentId: layerId,
			places: [
				{
					name: 'Blue Bottle',
					mapboxId: 'poi.1',
					coordinates: { lng: -122.4, lat: 37.8 },
				},
			],
		})
		doc = added.doc
		const placeId = added.addedIds[0]
		expect(placeId).toBeDefined()
		if (!placeId) throw new Error('missing place')

		expect(getEffectiveColor(doc, placeId)).toBe('#da2007')
		expect(isEffectivelyVisible(doc, placeId)).toBe(true)

		doc = setLayerVisible(doc, layerId, false)
		expect(isEffectivelyVisible(doc, placeId)).toBe(false)
		expect(listVisiblePlaces(doc)).toHaveLength(0)

		doc = setLayerVisible(doc, layerId, true)
		doc = setLayerColor(doc, layerId, '#136f63')
		expect(getEffectiveColor(doc, placeId)).toBe('#136f63')
	})

	it('cascades layer maki over place maki', () => {
		let doc = createEmptyDocument()
		const { doc: withLayer, layerId } = createLayer(doc, { name: 'Food' })
		doc = withLayer

		const added = addPlaces(doc, {
			targetParentId: layerId,
			places: [
				{
					name: 'Cafe',
					mapboxId: 'poi.maki',
					coordinates: { lng: 0, lat: 0 },
					maki: 'cafe',
				},
			],
		})
		doc = added.doc
		const placeId = added.addedIds[0]
		if (!placeId) throw new Error('missing place')

		expect(getEffectiveMaki(doc, placeId)).toBe('cafe')

		doc = setLayerMaki(doc, layerId, 'restaurant')
		expect(getEffectiveMaki(doc, placeId)).toBe('restaurant')

		doc = setLayerMaki(doc, layerId, undefined)
		expect(getEffectiveMaki(doc, placeId)).toBe('cafe')
	})

	it('nests layers and cascades visibility', () => {
		let doc = createEmptyDocument()
		const parent = createLayer(doc, { name: 'Parent', color: '#111111' })
		doc = parent.doc
		const child = createLayer(doc, {
			name: 'Child',
			parentId: parent.layerId,
			color: '#222222',
		})
		doc = child.doc

		const places = addPlaces(doc, {
			targetParentId: child.layerId,
			places: [
				{
					name: 'Nested Place',
					mapboxId: 'poi.2',
					coordinates: { lng: 0, lat: 0 },
				},
			],
		})
		doc = places.doc
		const placeId = places.addedIds[0]
		if (!placeId) throw new Error('missing place')

		expect(getEffectiveColor(doc, placeId)).toBe('#222222')

		doc = setLayerVisible(doc, parent.layerId, false)
		expect(isEffectivelyVisible(doc, placeId)).toBe(false)
		expect(isEffectivelyVisible(doc, child.layerId)).toBe(false)
	})

	it('ungroups a layer into its parent', () => {
		let doc = createEmptyDocument()
		const parent = createLayer(doc, { name: 'Parent' })
		doc = parent.doc
		const group = createLayer(doc, { name: 'Group', parentId: parent.layerId })
		doc = group.doc
		const places = addPlaces(doc, {
			targetParentId: group.layerId,
			places: [
				{
					name: 'A',
					mapboxId: 'a',
					coordinates: { lng: 1, lat: 1 },
				},
				{
					name: 'B',
					mapboxId: 'b',
					coordinates: { lng: 2, lat: 2 },
				},
			],
		})
		doc = places.doc
		doc = ungroupLayer(doc, group.layerId)

		expect(doc.nodes[group.layerId]).toBeUndefined()
		const parentLayer = doc.nodes[parent.layerId]
		expect(parentLayer?.kind).toBe('layer')
		if (parentLayer?.kind !== 'layer') throw new Error('expected layer')
		expect(parentLayer.children).toEqual(places.addedIds)
	})

	it('moves nodes and rejects cycles', () => {
		let doc = createEmptyDocument()
		const a = createLayer(doc, { name: 'A' })
		doc = a.doc
		const b = createLayer(doc, { name: 'B', parentId: a.layerId })
		doc = b.doc

		expect(() =>
			moveNodes(doc, {
				ids: [a.layerId],
				targetParentId: b.layerId,
				index: 0,
			}),
		).toThrow(/descendant/)

		doc = moveNodes(doc, {
			ids: [b.layerId],
			targetParentId: null,
			index: 0,
		})
		expect(doc.rootChildren[0]).toBe(b.layerId)
	})

	it('deletes recursively and dedupes mapbox ids', () => {
		let doc = createEmptyDocument()
		const layer = createLayer(doc, { name: 'L' })
		doc = layer.doc
		const first = addPlaces(doc, {
			targetParentId: layer.layerId,
			places: [
				{
					name: 'Same',
					mapboxId: 'dup',
					coordinates: { lng: 0, lat: 0 },
				},
			],
		})
		doc = first.doc
		const second = addPlaces(doc, {
			targetParentId: null,
			places: [
				{
					name: 'Same again',
					mapboxId: 'dup',
					coordinates: { lng: 1, lat: 1 },
				},
			],
		})
		expect(second.addedIds).toHaveLength(0)
		expect(second.skippedMapboxIds).toEqual(['dup'])

		doc = deleteNodes(doc, [layer.layerId])
		expect(doc.nodes[layer.layerId]).toBeUndefined()
		expect(doc.nodes[first.addedIds[0] ?? '']).toBeUndefined()
	})

	it('renames and uses root default color', () => {
		let doc = createEmptyDocument()
		const places = addPlaces(doc, {
			places: [
				{
					name: 'Root place',
					mapboxId: 'root.1',
					coordinates: { lng: 10, lat: 10 },
				},
			],
		})
		doc = places.doc
		const placeId = places.addedIds[0]
		if (!placeId) throw new Error('missing')
		expect(getEffectiveColor(doc, placeId)).toBe(doc.defaultPlaceColor)
		doc = renameNode(doc, placeId, '  Renamed  ')
		expect(doc.nodes[placeId]?.name).toBe('Renamed')
	})

	it('resolveDropTarget: place on layer appends as child', () => {
		let doc = createEmptyDocument()
		const layer = createLayer(doc, { name: 'L' })
		doc = layer.doc
		const places = addPlaces(doc, {
			places: [
				{
					name: 'A',
					mapboxId: 'a',
					coordinates: { lng: 0, lat: 0 },
				},
			],
		})
		doc = places.doc
		const placeId = places.addedIds[0]
		if (!placeId) throw new Error('missing')

		expect(resolveDropTarget(doc, placeId, layer.layerId)).toEqual({
			parentId: layer.layerId,
			index: 0,
		})
	})

	it('resolveDropTarget: layer on layer reorders as sibling (does not nest)', () => {
		let doc = createEmptyDocument()
		const a = createLayer(doc, { name: 'A' })
		doc = a.doc
		const b = createLayer(doc, { name: 'B' })
		doc = b.doc

		// Moving down: overIndex+1 so moveNodes lands after B (not a no-op)
		expect(resolveDropTarget(doc, a.layerId, b.layerId)).toEqual({
			parentId: null,
			index: 2,
		})
		// Moving up: insert at over's index
		expect(resolveDropTarget(doc, b.layerId, a.layerId)).toEqual({
			parentId: null,
			index: 0,
		})
	})

	it('resolveDropTarget: nested layer on parent layer moves to parent sibling slot', () => {
		let doc = createEmptyDocument()
		const parent = createLayer(doc, { name: 'Parent' })
		doc = parent.doc
		const child = createLayer(doc, {
			name: 'Child',
			parentId: parent.layerId,
		})
		doc = child.doc

		expect(resolveDropTarget(doc, child.layerId, parent.layerId)).toEqual({
			parentId: null,
			index: 0,
		})
	})

	it('resolveDropTarget: drop on sibling inserts at sibling index', () => {
		let doc = createEmptyDocument()
		const layer = createLayer(doc, { name: 'L' })
		doc = layer.doc
		const places = addPlaces(doc, {
			targetParentId: layer.layerId,
			places: [
				{ name: 'A', mapboxId: 'a', coordinates: { lng: 0, lat: 0 } },
				{ name: 'B', mapboxId: 'b', coordinates: { lng: 1, lat: 1 } },
			],
		})
		doc = places.doc
		const [aId, bId] = places.addedIds
		if (!aId || !bId) throw new Error('missing')

		expect(resolveDropTarget(doc, aId, bId)).toEqual({
			parentId: layer.layerId,
			index: 2,
		})
		expect(resolveDropTarget(doc, bId, aId)).toEqual({
			parentId: layer.layerId,
			index: 0,
		})
		expect(resolveDropTarget(doc, aId, aId)).toBeNull()
	})

	it('moveNodes + resolveDropTarget: downward sibling swap actually moves', () => {
		let doc = createEmptyDocument()
		const a = createLayer(doc, { name: 'A' })
		doc = a.doc
		const b = createLayer(doc, { name: 'B' })
		doc = b.doc
		const target = resolveDropTarget(doc, a.layerId, b.layerId)
		expect(target).not.toBeNull()
		if (!target) throw new Error('missing target')
		doc = moveNodes(doc, {
			ids: [a.layerId],
			targetParentId: target.parentId,
			index: target.index,
		})
		expect(doc.rootChildren).toEqual([b.layerId, a.layerId])
	})

	const emptyGeojson: IsochroneGeoJSON = { type: 'FeatureCollection', features: [] }

	it('adds isochrones with root color and nested inheritance', () => {
		let doc = createEmptyDocument()
		const root = addIsochrone(doc, {
			draft: {
				name: '30 min walk',
				center: { lng: -122, lat: 37 },
				profile: 'walking',
				metric: 'time',
				contours: [15],
				geojson: emptyGeojson,
				color: '#da2007',
				visible: true,
			},
		})
		doc = root.doc
		expect(getEffectiveColor(doc, root.id)).toBe('#da2007')
		expect(listVisibleIsochrones(doc)).toHaveLength(1)

		doc = setIsochroneVisible(doc, root.id, false)
		expect(listVisibleIsochrones(doc)).toHaveLength(0)
		doc = setIsochroneVisible(doc, root.id, true)
		doc = setIsochroneColor(doc, root.id, '#136f63')
		expect(getEffectiveColor(doc, root.id)).toBe('#136f63')

		const layer = createLayer(doc, { name: 'Area', color: '#1f01b9' })
		doc = layer.doc
		const nested = addIsochrone(doc, {
			targetParentId: layer.layerId,
			draft: {
				name: '5 mi bike',
				center: { lng: -122, lat: 37 },
				profile: 'cycling',
				metric: 'distance',
				contours: [milesToMeters(5)],
				geojson: emptyGeojson,
				color: '#ec9916',
				visible: true,
			},
		})
		doc = nested.doc
		expect(getParentId(doc, nested.id)).toBe(layer.layerId)
		expect(getEffectiveColor(doc, nested.id)).toBe('#1f01b9')

		doc = setLayerVisible(doc, layer.layerId, false)
		expect(isEffectivelyVisible(doc, nested.id)).toBe(false)
	})

	it('formats isochrone names', () => {
		expect(formatIsochroneName('walking', 'time', [15])).toBe('15 min walk')
		expect(formatIsochroneName('cycling', 'distance', [milesToMeters(5)])).toBe('5 mi bike')
		expect(formatIsochroneName('driving', 'distance', [milesToMeters(0.5)])).toBe('0.5 mi drive')
		expect(formatIsochroneName('driving', 'time', [20], '2219 Main Street')).toBe(
			'20 min drive from 2219 Main Street',
		)
		expect(formatIsochroneName('walking', 'time', [15], '  Café  ')).toBe('15 min walk from Café')
		expect(formatIsochroneName('driving', 'time', [10], '')).toBe('10 min drive')
		expect(formatIsochroneName('driving', 'time', [10], null)).toBe('10 min drive')
	})
})
