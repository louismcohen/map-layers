import {
	formatIsochroneName,
	type IsochroneDraft,
	type IsochroneMetric,
	type IsochroneProfile,
	type NodeId,
	pickRandomLayerColor,
} from '@map-layers/domain'
import { useCallback, useState } from 'react'
import type { IsochroneDialogCenter, IsochroneDialogResult } from '@/components/isochrone/IsochroneDialog'
import { IsochroneRequestError, mapboxIsochroneProvider } from '@/lib/isochrone'
import { useDocumentStore } from '@/store/documentStore'

export type IsochroneCreateRequest = {
	center: IsochroneDialogCenter
	/** null = root (search flow); layer id or null for sibling of a place */
	targetParentId: NodeId | null
}

export function useIsochroneCreate() {
	const addIsochrone = useDocumentStore((s) => s.addIsochrone)
	const pushToast = useDocumentStore((s) => s.pushToast)

	const [pending, setPending] = useState<IsochroneCreateRequest | null>(null)
	const [submitting, setSubmitting] = useState(false)

	const openForSearch = useCallback((center: IsochroneDialogCenter) => {
		setPending({ center, targetParentId: null })
	}, [])

	const openForPlace = useCallback(
		(center: IsochroneDialogCenter, placeParentId: NodeId | null) => {
			setPending({ center, targetParentId: placeParentId })
		},
		[],
	)

	const cancel = useCallback(() => {
		if (submitting) return
		setPending(null)
	}, [submitting])

	const confirm = useCallback(
		async (result: IsochroneDialogResult) => {
			if (!pending) return
			setSubmitting(true)
			try {
				const geojson = await mapboxIsochroneProvider.fetchContours({
					center: {
						lng: pending.center.lng,
						lat: pending.center.lat,
					},
					profile: result.profile,
					metric: result.metric,
					contours: result.contours,
				})
				const name = formatIsochroneName(result.profile, result.metric, result.contours)
				const draft: IsochroneDraft = {
					name,
					center: {
						lng: pending.center.lng,
						lat: pending.center.lat,
					},
					profile: result.profile,
					metric: result.metric,
					contours: result.contours,
					geojson,
					color: pickRandomLayerColor(),
					visible: true,
				}
				addIsochrone(draft, pending.targetParentId)
				setPending(null)
			} catch (error) {
				const message =
					error instanceof IsochroneRequestError
						? error.message
						: error instanceof Error
							? error.message
							: 'Could not create isochrone'
				pushToast(message)
			} finally {
				setSubmitting(false)
			}
		},
		[pending, addIsochrone, pushToast],
	)

	return {
		pending,
		dialogOpen: Boolean(pending),
		submitting,
		openForSearch,
		openForPlace,
		cancel,
		confirm,
	}
}

export type { IsochroneMetric, IsochroneProfile }
