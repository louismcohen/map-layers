import { listLayers, type NodeId, pickRandomLayerColor } from '@map-layers/domain'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { MapRef } from 'react-map-gl'
import { useDebouncedCallback } from 'use-debounce'
import { forwardSearch } from '@/lib/mapboxSearch'
import { fitToCoordinates } from '@/lib/mapCamera'
import { type AddTarget, useDocumentStore } from '@/store/documentStore'

export type SearchDestination =
	| { mode: 'root' }
	| { mode: 'layer'; layerId: NodeId }
	| { mode: 'new-layer' }

export function usePlaceSearch(mapRef: React.RefObject<MapRef | null>) {
	const document = useDocumentStore((s) => s.document)
	const searchPreview = useDocumentStore((s) => s.searchPreview)
	const addPlaces = useDocumentStore((s) => s.addPlaces)
	const pushToast = useDocumentStore((s) => s.pushToast)
	const selectPlace = useDocumentStore((s) => s.selectPlace)
	const setSearchPreview = useDocumentStore((s) => s.setSearchPreview)
	const toggleSearchSelection = useDocumentStore((s) => s.toggleSearchSelection)
	const setSearchSelection = useDocumentStore((s) => s.setSearchSelection)

	const [query, setQuery] = useState('')
	const [loading, setLoading] = useState(false)
	const [adding, setAdding] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [destination, setDestination] = useState<SearchDestination>({ mode: 'new-layer' })
	const [newLayerName, setNewLayerName] = useState('')
	const abortRef = useRef<AbortController | null>(null)

	const layers = useMemo(() => listLayers(document), [document])
	const results = searchPreview?.results ?? []
	const selected = useMemo(
		() => new Set(searchPreview?.selectedMapboxIds ?? []),
		[searchPreview?.selectedMapboxIds],
	)

	const runSearch = useDebouncedCallback(async (value: string) => {
		abortRef.current?.abort()
		const controller = new AbortController()
		abortRef.current = controller

		if (!value.trim()) {
			setSearchPreview(null)
			setLoading(false)
			setError(null)
			return
		}

		const map = mapRef.current?.getMap()
		const center = map?.getCenter()
		const bounds = map?.getBounds()

		try {
			setLoading(true)
			setError(null)

			const drafts = await forwardSearch({
				query: value,
				proximity: center ? { lng: center.lng, lat: center.lat } : undefined,
				bbox: bounds
					? [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]
					: undefined,
				signal: controller.signal,
			})

			if (controller.signal.aborted) return

			if (drafts.length === 0) {
				setSearchPreview(null)
				return
			}

			const existingColor = useDocumentStore.getState().searchPreview?.color
			setSearchPreview({
				color: existingColor ?? pickRandomLayerColor(),
				results: drafts,
				selectedMapboxIds: [],
			})
		} catch (err) {
			if ((err as Error).name === 'AbortError') return
			setError(err instanceof Error ? err.message : 'Search failed')
			setSearchPreview(null)
		} finally {
			if (!controller.signal.aborted) setLoading(false)
		}
	}, 300)

	useEffect(() => {
		runSearch(query)
	}, [query, runSearch])

	useEffect(() => {
		setNewLayerName(query.trim())
	}, [query])

	const selectAll = () => setSearchSelection(results.map((r) => r.mapboxId))

	const addSelected = async () => {
		if (!searchPreview || selected.size === 0) return
		setAdding(true)
		try {
			const drafts = searchPreview.results.filter((r) => selected.has(r.mapboxId))
			let target: AddTarget
			if (destination.mode === 'root') target = { type: 'root' }
			else if (destination.mode === 'layer')
				target = { type: 'layer', layerId: destination.layerId }
			else
				target = {
					type: 'new-layer',
					name: newLayerName.trim() || query.trim() || 'New layer',
					color: searchPreview.color,
				}

			const addedIds = addPlaces(drafts, target)
			setSearchPreview(null)
			if (addedIds[0]) selectPlace(addedIds[0])

			const doc = useDocumentStore.getState().document
			const coords = addedIds
				.map((id) => doc.nodes[id])
				.filter((n): n is Extract<typeof n, { kind: 'place' }> => n?.kind === 'place')
				.map((p) => p.coordinates)

			fitToCoordinates(mapRef, coords, { padding: 80, duration: 700 })
			setQuery('')
		} catch (err) {
			pushToast(err instanceof Error ? err.message : 'Could not add places')
		} finally {
			setAdding(false)
		}
	}

	return {
		query,
		setQuery,
		loading,
		adding,
		error,
		destination,
		setDestination,
		newLayerName,
		setNewLayerName,
		layers,
		results,
		selected,
		searchPreview,
		toggleSearchSelection,
		selectAll,
		addSelected,
	}
}
