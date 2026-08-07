import { listLayers, type NodeId, pickRandomLayerColor, type PlaceDraft } from '@map-layers/domain'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { MapRef } from 'react-map-gl'
import { useDebouncedCallback } from 'use-debounce'
import { cn } from '@/lib/cn'
import { forwardSearch } from '@/lib/mapboxSearch'
import { type AddTarget, useDocumentStore } from '@/store/documentStore'

type SearchPanelProps = {
	mapRef: React.RefObject<MapRef | null>
}

type Destination = { mode: 'root' } | { mode: 'layer'; layerId: NodeId } | { mode: 'new-layer' }

function fitMapToPlaces(mapRef: React.RefObject<MapRef | null>, places: PlaceDraft[]) {
	if (!mapRef.current || places.length === 0) return
	if (places.length === 1 && places[0]) {
		mapRef.current.flyTo({
			center: [places[0].coordinates.lng, places[0].coordinates.lat],
			zoom: 14,
			duration: 700,
		})
		return
	}
	const lngs = places.map((p) => p.coordinates.lng)
	const lats = places.map((p) => p.coordinates.lat)
	mapRef.current.fitBounds(
		[
			[Math.min(...lngs), Math.min(...lats)],
			[Math.max(...lngs), Math.max(...lats)],
		],
		{ padding: 80, duration: 700 },
	)
}

export function SearchPanel({ mapRef }: SearchPanelProps) {
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
	const [destination, setDestination] = useState<Destination>({ mode: 'new-layer' })
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

			const color = pickRandomLayerColor()
			setSearchPreview({
				color,
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

	const handleAdd = async () => {
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
			if (addedIds[0]) selectPlace(addedIds[0])

			const doc = useDocumentStore.getState().document
			const coords = addedIds
				.map((id) => doc.nodes[id])
				.filter((n): n is Extract<typeof n, { kind: 'place' }> => n?.kind === 'place')

			fitMapToPlaces(
				mapRef,
				coords.map((p) => ({
					mapboxId: p.mapboxId,
					name: p.name,
					coordinates: p.coordinates,
					address: p.address,
					featureType: p.featureType,
				})),
			)

			setQuery('')
		} catch (err) {
			pushToast(err instanceof Error ? err.message : 'Could not add places')
		} finally {
			setAdding(false)
		}
	}

	return (
		<div className="flex max-h-[45%] min-h-[180px] flex-col border-t border-neutral-800">
			<div className="border-b border-neutral-800 px-3 py-2">
				<div className="mb-2 flex items-center justify-between gap-2">
					<h2 className="text-xs font-semibold tracking-wide text-neutral-300 uppercase">
						Search places
					</h2>
					{searchPreview ? (
						<span
							className="inline-flex items-center gap-1.5 text-[11px] text-neutral-400"
							title="Preview / new-layer color"
						>
							<span
								className="h-3 w-3 rounded-sm border border-white/20"
								style={{ backgroundColor: searchPreview.color }}
							/>
							Pin color
						</span>
					) : null}
				</div>
				<input
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Coffee, museums, addresses…"
					className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 outline-none placeholder:text-neutral-600 focus:border-neutral-500"
				/>
			</div>

			<div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
				{loading ? <p className="px-1 py-2 text-xs text-neutral-500">Searching…</p> : null}
				{error ? <p className="px-1 py-2 text-xs text-red-400">{error}</p> : null}
				{!loading && query && results.length === 0 && !error ? (
					<p className="px-1 py-2 text-xs text-neutral-500">No results</p>
				) : null}
				<ul className="space-y-1">
					{results.map((result) => {
						const checked = selected.has(result.mapboxId)
						return (
							<li key={result.mapboxId}>
								<label
									className={cn(
										'flex cursor-pointer gap-2 rounded-md px-2 py-1.5 hover:bg-neutral-800/80',
										checked && 'bg-neutral-800',
									)}
								>
									<input
										type="checkbox"
										checked={checked}
										onChange={() => toggleSearchSelection(result.mapboxId)}
										className="mt-0.5"
									/>
									{searchPreview ? (
										<span
											className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full border border-white/20"
											style={{ backgroundColor: searchPreview.color }}
										/>
									) : null}
									<span className="min-w-0">
										<span className="block truncate text-xs text-neutral-100">{result.name}</span>
										{result.address ? (
											<span className="block truncate text-[11px] text-neutral-500">
												{result.address}
											</span>
										) : null}
									</span>
								</label>
							</li>
						)
					})}
				</ul>
			</div>

			<div className="space-y-2 border-t border-neutral-800 px-3 py-2">
				<div className="flex gap-2">
					<button
						type="button"
						onClick={selectAll}
						disabled={results.length === 0}
						className="text-xs text-neutral-400 hover:text-neutral-200 disabled:opacity-40"
					>
						Select all
					</button>
					<span className="text-xs text-neutral-600">{selected.size} selected</span>
				</div>

				<label className="block text-[11px] text-neutral-500" htmlFor="add-dest">
					Add to
				</label>
				<select
					id="add-dest"
					value={destination.mode === 'layer' ? `layer:${destination.layerId}` : destination.mode}
					onChange={(e) => {
						const value = e.target.value
						if (value === 'root') setDestination({ mode: 'root' })
						else if (value === 'new-layer') setDestination({ mode: 'new-layer' })
						else if (value.startsWith('layer:'))
							setDestination({ mode: 'layer', layerId: value.slice(6) })
					}}
					className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-xs text-neutral-100"
				>
					<option value="new-layer">New layer</option>
					<option value="root">Top level</option>
					{layers.map((layer) => (
						<option key={layer.id} value={`layer:${layer.id}`}>
							{layer.name}
						</option>
					))}
				</select>

				{destination.mode === 'new-layer' ? (
					<input
						value={newLayerName}
						onChange={(e) => setNewLayerName(e.target.value)}
						placeholder="Layer name"
						className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-xs text-neutral-100 outline-none focus:border-neutral-500"
					/>
				) : null}

				<button
					type="button"
					disabled={selected.size === 0 || adding}
					onClick={handleAdd}
					className={cn(
						'w-full rounded-md bg-neutral-100 py-2 text-xs font-semibold text-neutral-900',
						(selected.size === 0 || adding) && 'opacity-40',
					)}
				>
					{adding ? 'Adding…' : 'Add selected'}
				</button>
			</div>
		</div>
	)
}
