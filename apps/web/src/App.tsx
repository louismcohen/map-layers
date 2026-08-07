import { useEffect, useRef } from 'react';
import type { MapRef } from 'react-map-gl';
import { LayersPanel } from '@/components/layers/LayersPanel';
import { LocateButton } from '@/components/map/LocateButton';
import { MapView } from '@/components/map/MapView';
import { PlaceDetail } from '@/components/PlaceDetail';
import { SearchPanel } from '@/components/search/SearchPanel';
import { Toaster } from '@/components/ui/sonner';
import { useLocation } from '@/hooks/useLocation';
import { useDocumentStore } from '@/store/documentStore';

export function App() {
    const mapRef = useRef<MapRef>(null);
    const hydrated = useDocumentStore((s) => s.hydrated);
    const setHydrated = useDocumentStore((s) => s.setHydrated);
    const userLocation = useLocation();

    useEffect(() => {
        const unsub = useDocumentStore.persist.onFinishHydration(() => {
            setHydrated(true);
        });
        if (useDocumentStore.persist.hasHydrated()) {
            setHydrated(true);
        }
        return unsub;
    }, [setHydrated]);

    return (
        <div className='flex h-svh w-screen overflow-hidden bg-background text-foreground'>
            <aside className='relative z-30 flex w-75 shrink-0 flex-col gap-8 border-r border-sidebar-border bg-sidebar text-sidebar-foreground'>
                <SearchPanel mapRef={mapRef} />

                <div className='min-h-0'>
                    <LayersPanel mapRef={mapRef} />
                </div>
            </aside>

            <main className='relative min-w-0 flex-1'>
                {hydrated ? (
                    <MapView mapRef={mapRef} userLocation={userLocation} />
                ) : (
                    <div className='flex h-full items-center justify-center text-sm text-muted-foreground'>
                        Loading map…
                    </div>
                )}
                <LocateButton
                    mapRef={mapRef}
                    userLocation={userLocation}
                    className='absolute right-4 bottom-4 z-20'
                />
                <PlaceDetail />
                <Toaster position='bottom-right' />
            </main>
        </div>
    );
}
