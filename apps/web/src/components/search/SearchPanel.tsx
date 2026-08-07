import type { MapRef } from 'react-map-gl'
import { usePlaceSearch } from '@/hooks/usePlaceSearch'
import { cn } from '@/lib/cn'

type SearchPanelProps = {
	mapRef: React.RefObject<MapRef | null>
}

export function SearchPanel({ mapRef }: SearchPanelProps) {
	const {
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
	} = usePlaceSearch(mapRef)

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
					onClick={addSelected}
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
