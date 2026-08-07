import { Button } from '@/components/ui/button'
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
		<div className="absolute right-4 bottom-16 left-4 z-20 mx-auto max-w-md rounded-xl border border-border bg-card/95 p-4 text-card-foreground shadow-2xl backdrop-blur">
			<div className="mb-1 flex items-start justify-between gap-3">
				<h2 className="font-heading text-sm font-semibold">{place.name}</h2>
				<Button type="button" variant="ghost" size="xs" onClick={() => selectPlace(null)}>
					Close
				</Button>
			</div>
			{place.address ? <p className="text-xs text-muted-foreground">{place.address}</p> : null}
			{place.featureType ? (
				<p className="mt-2 text-[11px] tracking-wide text-muted-foreground uppercase">
					{place.featureType}
				</p>
			) : null}
		</div>
	)
}
