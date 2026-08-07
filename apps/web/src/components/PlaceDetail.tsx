import { useDocumentStore } from '@/store/documentStore'

export function PlaceDetail() {
	const selectedPlaceId = useDocumentStore((s) => s.selectedPlaceId)
	const document = useDocumentStore((s) => s.document)
	const selectPlace = useDocumentStore((s) => s.selectPlace)

	const place =
		selectedPlaceId && document.nodes[selectedPlaceId]?.kind === 'place'
			? document.nodes[selectedPlaceId]
			: null

	if (place?.kind !== 'place') return null

	return (
		<div className="absolute right-4 bottom-16 left-4 z-20 mx-auto max-w-md rounded-xl border border-neutral-700/80 bg-neutral-900/95 p-4 shadow-2xl backdrop-blur">
			<div className="mb-1 flex items-start justify-between gap-3">
				<h2 className="text-sm font-semibold text-neutral-50">{place.name}</h2>
				<button
					type="button"
					onClick={() => selectPlace(null)}
					className="text-xs text-neutral-400 hover:text-neutral-200"
				>
					Close
				</button>
			</div>
			{place.address ? <p className="text-xs text-neutral-400">{place.address}</p> : null}
			{place.featureType ? (
				<p className="mt-2 text-[11px] tracking-wide text-neutral-500 uppercase">
					{place.featureType}
				</p>
			) : null}
		</div>
	)
}
