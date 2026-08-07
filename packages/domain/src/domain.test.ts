import { describe, expect, it } from 'vitest'
import { createEmptyDocument } from './document'
import {
	addPlaces,
	createLayer,
	deleteNodes,
	moveNodes,
	renameNode,
	setLayerColor,
	setLayerVisible,
	ungroupLayer,
} from './mutations'
import { resolveDropTarget } from './resolveDropTarget'
import { getEffectiveColor, isEffectivelyVisible, listVisiblePlaces } from './selectors'

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

	it('resolveDropTarget: drop on layer appends as child', () => {
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
			index: 1,
		})
		expect(resolveDropTarget(doc, aId, aId)).toBeNull()
	})
})
