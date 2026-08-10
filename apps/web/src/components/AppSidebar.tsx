import type { MapRef } from 'react-map-gl'
import { LayersPanel } from '@/components/layers/LayersPanel'
import { SearchPanel } from '@/components/search/SearchPanel'
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarRail,
	SidebarSeparator,
} from '@/components/ui/sidebar'

type AppSidebarProps = {
	mapRef: React.RefObject<MapRef | null>
}

export function AppSidebar({ mapRef }: AppSidebarProps) {
	return (
		<Sidebar
			variant="floating"
			collapsible="offcanvas"
			className="pointer-events-none [&_[data-slot=sidebar-inner]]:pointer-events-auto"
		>
			<SidebarHeader className="gap-0 p-0">
				<SearchPanel mapRef={mapRef} />
			</SidebarHeader>
			<SidebarSeparator className="mx-0" />
			<SidebarContent className="gap-0 overflow-hidden p-0">
				<LayersPanel mapRef={mapRef} />
			</SidebarContent>
			<SidebarRail />
		</Sidebar>
	)
}
