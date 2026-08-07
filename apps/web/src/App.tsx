import { useEffect, useRef } from 'react'
import type { MapRef } from 'react-map-gl'
import { LayersPanel } from '@/components/layers/LayersPanel'
import { LocateButton } from '@/components/map/LocateButton'
import { MapView } from '@/components/map/MapView'
import { PlaceDetail } from '@/components/PlaceDetail'
import { SearchPanel } from '@/components/search/SearchPanel'
import { ToastStack } from '@/components/ToastStack'
import { useFlyToSelectedPlace } from '@/hooks/useFlyToSelectedPlace'
import { useLocation } from '@/hooks/useLocation'
import { useDocumentStore } from '@/store/documentStore'

export function App() {
	const mapRef = useRef<MapRef>(null)
	const hydrated = useDocumentStore((s) => s.hydrated)
	const setHydrated = useDocumentStore((s) => s.setHydrated)
	const userLocation = useLocation()
	useFlyToSelectedPlace(mapRef)

	useEffect(() => {
		const unsub = useDocumentStore.persist.onFinishHydration(() => {
			setHydrated(true)
		})
		if (useDocumentStore.persist.hasHydrated()) {
			setHydrated(true)
		}
		return unsub
	}, [setHydrated])

	return (
		<div className="flex h-svh w-screen overflow-hidden bg-neutral-950 text-neutral-50">
			<aside className="relative z-30 flex w-[300px] shrink-0 flex-col border-r border-neutral-800 bg-neutral-950/95 backdrop-blur">
				<div className="min-h-0 flex-1">
					<LayersPanel mapRef={mapRef} />
				</div>
				<SearchPanel mapRef={mapRef} />
			</aside>

			<main className="relative min-w-0 flex-1">
				{hydrated ? (
					<MapView mapRef={mapRef} userLocation={userLocation} />
				) : (
					<div className="flex h-full items-center justify-center text-sm text-neutral-500">
						Loading map…
					</div>
				)}
				<LocateButton
					mapRef={mapRef}
					userLocation={userLocation}
					className="absolute right-4 bottom-4 z-20"
				/>
				<PlaceDetail />
				<ToastStack />
			</main>
		</div>
	)
}
