import { getParentId } from '@map-layers/domain'
import { useState } from 'react'
import type { MapRef } from 'react-map-gl'
import { IsochroneDialog } from '@/components/isochrone/IsochroneDialog'
import { ConfirmModal, PromptModal } from '@/components/modals'
import { Button } from '@/components/ui/button'
import { useIsochroneCreate } from '@/hooks/useIsochroneCreate'
import { fitToCoordinates } from '@/lib/mapCamera'
import { useDocumentStore } from '@/store/documentStore'

type PlaceDetailProps = {
	mapRef: React.RefObject<MapRef | null>
}

export function PlaceDetail({ mapRef }: PlaceDetailProps) {
	const selectedPlaceId = useDocumentStore((s) => s.selectedPlaceId)
	const document = useDocumentStore((s) => s.document)
	const selectPlace = useDocumentStore((s) => s.selectPlace)
	const renameNode = useDocumentStore((s) => s.renameNode)
	const deleteNodes = useDocumentStore((s) => s.deleteNodes)

	const isochrone = useIsochroneCreate()
	const [renameOpen, setRenameOpen] = useState(false)
	const [deleteOpen, setDeleteOpen] = useState(false)

	const place =
		selectedPlaceId && document.nodes[selectedPlaceId]?.kind === 'place'
			? document.nodes[selectedPlaceId]
			: null

	if (place?.kind !== 'place' || !selectedPlaceId) return null

	const placeId = selectedPlaceId

	return (
		<>
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
				<div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
					<Button
						type="button"
						variant="secondary"
						size="xs"
						onClick={() => {
							isochrone.openForPlace(
								{
									lng: place.coordinates.lng,
									lat: place.coordinates.lat,
									label: place.name,
								},
								getParentId(document, placeId),
							)
						}}
					>
						Add Isochrone…
					</Button>
					<Button type="button" variant="secondary" size="xs" onClick={() => setRenameOpen(true)}>
						Rename
					</Button>
					<Button
						type="button"
						variant="secondary"
						size="xs"
						onClick={() => {
							fitToCoordinates(mapRef, [place.coordinates], {
								padding: 60,
								duration: 700,
							})
						}}
					>
						Fit to Map
					</Button>
					<Button
						type="button"
						variant="destructive"
						size="xs"
						onClick={() => setDeleteOpen(true)}
					>
						Delete
					</Button>
				</div>
			</div>

			<PromptModal
				open={renameOpen}
				title="Rename"
				label="Name"
				initialValue={place.name}
				confirmLabel="Save"
				onCancel={() => setRenameOpen(false)}
				onConfirm={(name) => {
					renameNode(placeId, name)
					setRenameOpen(false)
				}}
			/>

			<ConfirmModal
				open={deleteOpen}
				title="Delete"
				message="Delete this place? This cannot be undone."
				onCancel={() => setDeleteOpen(false)}
				onConfirm={() => {
					deleteNodes([placeId])
					setDeleteOpen(false)
					selectPlace(null)
				}}
			/>

			<IsochroneDialog
				open={isochrone.dialogOpen}
				center={isochrone.pending?.center ?? null}
				submitting={isochrone.submitting}
				onCancel={isochrone.cancel}
				onConfirm={isochrone.confirm}
			/>
		</>
	)
}
