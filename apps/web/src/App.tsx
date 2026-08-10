import { useEffect, useRef } from 'react';
import type { MapRef } from 'react-map-gl';
import { AppSidebar } from '@/components/AppSidebar';
import { LocateButton } from '@/components/map/LocateButton';
import { MapView } from '@/components/map/MapView';
import { PlaceDetail } from '@/components/PlaceDetail';
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useLocation } from '@/hooks/useLocation';
import { useDocumentStore } from '@/store/documentStore';

/** Matches prior ~300px pane; floating variant adds p-2 around the panel. */
const SIDEBAR_WIDTH = '400px';

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
        <TooltipProvider>
            <div className='relative h-svh w-screen overflow-hidden bg-background text-foreground'>
                {/* Full-bleed map under the floating sidebar (visible in the p-2 gutter). */}
                <div className='absolute inset-0 z-0'>
                    {hydrated ? (
                        <MapView mapRef={mapRef} userLocation={userLocation} />
                    ) : (
                        <div className='flex h-full items-center justify-center text-sm text-muted-foreground'>
                            Loading map…
                        </div>
                    )}
                </div>

                <SidebarProvider
                    className='pointer-events-none relative z-10 h-svh min-h-0 bg-transparent'
                    style={
                        {
                            '--sidebar-width': SIDEBAR_WIDTH,
                        } as React.CSSProperties
                    }
                >
                    <AppSidebar mapRef={mapRef} />

                    {/* Offset by sidebar width; transparent so the map shows through. */}
                    <SidebarInset className='min-h-0 bg-transparent pointer-events-none'>
                        <div className='pointer-events-auto absolute top-3 left-3 z-20 md:hidden'>
                            <SidebarTrigger className='border border-border bg-background/90 shadow-sm backdrop-blur' />
                        </div>
                        <LocateButton
                            mapRef={mapRef}
                            userLocation={userLocation}
                            className='pointer-events-auto absolute right-4 bottom-4 z-20'
                        />
                        <div className='pointer-events-auto'>
                            <PlaceDetail mapRef={mapRef} />
                        </div>
                        <Toaster position='bottom-right' />
                    </SidebarInset>
                </SidebarProvider>
            </div>
        </TooltipProvider>
    );
}
