import { listLayers, type NodeId } from '@map-layers/domain'
import { useEffect, useMemo, useState } from 'react'
import type { MapRef } from 'react-map-gl'
import { useDebouncedCallback } from 'use-debounce'
import { cn } from '@/lib/cn'
import { retrievePlaces, type SearchSuggestion, suggestPlaces } from '@/lib/mapboxSearch'
import { type AddTarget, useDocumentStore } from '@/store/documentStore'

type SearchPanelProps = {
	mapRef: React.RefObject<MapRef | null>
}

type Destination = { mode: 'root' } | { mode: 'layer'; layerId: NodeId } | { mode: 'new-layer' }

export function SearchPanel({ mapRef }: SearchPanelProps) {
	const document = useDocumentStore((s) => s.document)
	const addPlaces = useDocumentStore((s) => s.addPlaces)
	const pushToast = useDocumentStore((s) => s.pushToast)
	const selectPlace = useDocumentStore((s) => s.selectPlace)

	const [query, setQuery] = useState('')
	const [results, setResults] = useState<SearchSuggestion[]>([])
	const [selected, setSelected] = useState<Set<string>>(new Set())
	const [loading, setLoading] = useState(false)
	const [adding, setAdding] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [destination, setDestination] = useState<Destination>({ mode: 'new-layer' })
	const [newLayerName, setNewLayerName] = useState('')

	const layers = useMemo(() => listLayers(document), [document])

	const runSuggest = useDebouncedCallback(async (value: string) => {
		if (!value.trim()) {
			setResults([])
			setLoading(false)
			return
		}
		const map = mapRef.current?.getMap()
		const center = map?.getCenter()
		const bounds = map?.getBounds()
		const controller = new AbortController()
		try {
			setLoading(true)
			setError(null)
			const suggestions = await suggestPlaces({
				query: value,
				proximity: center ? { lng: center.lng, lat: center.lat } : undefined,
				bbox: bounds
					? [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]
					: undefined,
				signal: controller.signal,
			})
			setResults(suggestions)
			setSelected(new Set())
		} catch (err) {
			if ((err as Error).name === 'AbortError') return
			setError(err instanceof Error ? err.message : 'Search failed')
			setResults([])
		} finally {
			setLoading(false)
		}
	}, 300)

	useEffect(() => {
		runSuggest(query)
	}, [query, runSuggest])

	useEffect(() => {
		setNewLayerName(query.trim())
	}, [query])

	const toggle = (id: string) => {
		setSelected((prev) => {
			const next = new Set(prev)
			if (next.has(id)) next.delete(id)
			else next.add(id)
			return next
		})
	}

	const selectAll = () => setSelected(new Set(results.map((r) => r.mapboxId)))

	const handleAdd = async () => {
		const ids = [...selected]
		if (ids.length === 0) return
		setAdding(true)
		try {
			const drafts = await retrievePlaces(ids)
			let target: AddTarget
			if (destination.mode === 'root') target = { type: 'root' }
			else if (destination.mode === 'layer')
				target = { type: 'layer', layerId: destination.layerId }
			else
				target = {
					type: 'new-layer',
					name: newLayerName.trim() || query.trim() || 'New layer',
				}

			const addedIds = addPlaces(drafts, target)
			if (addedIds[0]) selectPlace(addedIds[0])

			const doc = useDocumentStore.getState().document
			const coords = addedIds
				.map((id) => doc.nodes[id])
				.filter((n): n is Extract<typeof n, { kind: 'place' }> => n?.kind === 'place')
				.map((p) => p.coordinates)

			if (coords.length && mapRef.current) {
				if (coords.length === 1 && coords[0]) {
					mapRef.current.flyTo({
						center: [coords[0].lng, coords[0].lat],
						zoom: 14,
						duration: 700,
					})
				} else {
					const lngs = coords.map((p) => p.lng)
					const lats = coords.map((p) => p.lat)
					mapRef.current.fitBounds(
						[
							[Math.min(...lngs), Math.min(...lats)],
							[Math.max(...lngs), Math.max(...lats)],
						],
						{ padding: 80, duration: 700 },
					)
				}
			}

			setSelected(new Set())
		} catch (err) {
			pushToast(err instanceof Error ? err.message : 'Could not add places')
		} finally {
			setAdding(false)
		}
	}

	return (
		<div className="flex max-h-[45%] min-h-[180px] flex-col border-t border-neutral-800">
			<div className="border-b border-neutral-800 px-3 py-2">
				<h2 className="mb-2 text-xs font-semibold tracking-wide text-neutral-300 uppercase">
					Search places
				</h2>
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
										onChange={() => toggle(result.mapboxId)}
										className="mt-0.5"
									/>
									<span className="min-w-0">
										<span className="block truncate text-xs text-neutral-100">{result.name}</span>
										{result.fullAddress ? (
											<span className="block truncate text-[11px] text-neutral-500">
												{result.fullAddress}
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
