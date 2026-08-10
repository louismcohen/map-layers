import type { MapRef } from 'react-map-gl';
import { LayersPanel } from '@/components/layers/LayersPanel';
import { SearchPanel } from '@/components/search/SearchPanel';
import { Sidebar, SidebarRail, SidebarSeparator } from '@/components/ui/sidebar';

type AppSidebarProps = {
    mapRef: React.RefObject<MapRef | null>;
};

export function AppSidebar({ mapRef }: AppSidebarProps) {
    return (
        <Sidebar
            variant='floating'
            collapsible='offcanvas'
            className='pointer-events-none **:data-[slot=sidebar-inner]:pointer-events-auto'
        >
            <div className='flex h-full min-h-0 flex-col overflow-hidden'>
                <div className='flex max-h-1/2 min-h-0 shrink flex-col overflow-hidden'>
                    <SearchPanel mapRef={mapRef} />
                </div>
                <SidebarSeparator className='mx-0 shrink-0' />
                <div className='mt-auto flex max-h-1/2 min-h-0 shrink flex-col overflow-hidden'>
                    <LayersPanel mapRef={mapRef} />
                </div>
            </div>
            <SidebarRail />
        </Sidebar>
    );
}
