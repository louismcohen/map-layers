import { listLayers, type NodeId, pickRandomLayerColor } from '@map-layers/domain'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { MapRef } from 'react-map-gl'
import { useDebouncedCallback } from 'use-debounce'
import { type SearchBounds, searchText } from '@/lib/googlePlacesSearch'
import { type AddTarget, useDocumentStore } from '@/store/documentStore'

export type SearchDestination =
	| { mode: 'root' }
	| { mode: 'layer'; layerId: NodeId }
	| { mode: 'new-layer' }

type PageParams = {
	query: string
	bounds?: SearchBounds
}

function boundsFromMap(mapRef: React.RefObject<MapRef | null>): SearchBounds | undefined {
	const bounds = mapRef.current?.getMap()?.getBounds()
	if (!bounds) return undefined
	return {
		west: bounds.getWest(),
		south: bounds.getSouth(),
		east: bounds.getEast(),
		north: bounds.getNorth(),
	}
}

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
	const [loadingMore, setLoadingMore] = useState(false)
	const [adding, setAdding] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [nextPageToken, setNextPageToken] = useState<string | null>(null)
	const [destination, setDestination] = useState<SearchDestination>({ mode: 'new-layer' })
	const [newLayerName, setNewLayerName] = useState('')
	const abortRef = useRef<AbortController | null>(null)
	const pageParamsRef = useRef<PageParams | null>(null)

	const layers = useMemo(() => listLayers(document), [document])
	const results = searchPreview?.results ?? []
	const selected = useMemo(
		() => new Set(searchPreview?.selectedMapboxIds ?? []),
		[searchPreview?.selectedMapboxIds],
	)

	const runSearch = useDebouncedCallback(async (value: string) => {
		if (!value.trim()) return

		abortRef.current?.abort()
		const controller = new AbortController()
		abortRef.current = controller

		const pageParams: PageParams = {
			query: value,
			bounds: boundsFromMap(mapRef),
		}
		pageParamsRef.current = pageParams

		try {
			setLoadingMore(false)
			setError(null)
			setNextPageToken(null)

			const page = await searchText({
				query: pageParams.query,
				bounds: pageParams.bounds,
				signal: controller.signal,
			})

			if (controller.signal.aborted) return

			setNextPageToken(page.nextPageToken ?? null)

			if (page.drafts.length === 0) {
				setSearchPreview(null)
				return
			}

			const existingColor = useDocumentStore.getState().searchPreview?.color
			setSearchPreview({
				color: existingColor ?? pickRandomLayerColor(),
				results: page.drafts,
				selectedMapboxIds: [],
			})
		} catch (err) {
			if ((err as Error).name === 'AbortError') return
			setError(err instanceof Error ? err.message : 'Search failed')
			setNextPageToken(null)
			setSearchPreview(null)
		} finally {
			if (!controller.signal.aborted) setLoading(false)
		}
	}, 300)

	useEffect(() => {
		if (!query.trim()) {
			abortRef.current?.abort()
			runSearch.cancel()
			pageParamsRef.current = null
			setNextPageToken(null)
			setSearchPreview(null)
			setLoading(false)
			setLoadingMore(false)
			setError(null)
			return
		}

		setLoading(true)
		setError(null)
		runSearch(query)
	}, [query, runSearch, setSearchPreview])

	useEffect(() => {
		setNewLayerName(query.trim())
	}, [query])

	const loadMore = async () => {
		const pageParams = pageParamsRef.current
		const token = nextPageToken
		if (!pageParams || !token || loadingMore || loading) return

		abortRef.current?.abort()
		const controller = new AbortController()
		abortRef.current = controller

		try {
			setLoadingMore(true)
			setError(null)

			const page = await searchText({
				query: pageParams.query,
				bounds: pageParams.bounds,
				pageToken: token,
				signal: controller.signal,
			})

			if (controller.signal.aborted) return

			setNextPageToken(page.nextPageToken ?? null)

			const preview = useDocumentStore.getState().searchPreview
			if (!preview) {
				if (page.drafts.length === 0) return
				setSearchPreview({
					color: pickRandomLayerColor(),
					results: page.drafts,
					selectedMapboxIds: [],
				})
				return
			}

			const seen = new Set(preview.results.map((r) => r.mapboxId))
			const appended = page.drafts.filter((draft) => {
				if (seen.has(draft.mapboxId)) return false
				seen.add(draft.mapboxId)
				return true
			})
			if (appended.length === 0) return

			setSearchPreview({
				...preview,
				results: [...preview.results, ...appended],
			})
		} catch (err) {
			if ((err as Error).name === 'AbortError') return
			setError(err instanceof Error ? err.message : 'Search failed')
		} finally {
			if (!controller.signal.aborted) setLoadingMore(false)
		}
	}

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
			pageParamsRef.current = null
			setNextPageToken(null)
			setSearchPreview(null)
			if (addedIds[0]) selectPlace(addedIds[0])
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
		loadingMore,
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
		nextPageToken,
		toggleSearchSelection,
		selectAll,
		addSelected,
		loadMore,
	}
}
