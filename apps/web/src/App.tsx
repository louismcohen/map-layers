import { useRef } from 'react'
import type { MapRef } from 'react-map-gl'
import { AppSidebar } from '@/components/AppSidebar'
import { AuthGate } from '@/components/auth/AuthGate'
import { LocateButton } from '@/components/map/LocateButton'
import { MapView } from '@/components/map/MapView'
import { PlaceDetail } from '@/components/PlaceDetail'
import { AppSidebarProvider } from '@/components/sidebar/AppSidebarProvider'
import { SidebarToggleButton } from '@/components/sidebar/SidebarToggleButton'
import { SidebarInset } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useLocation } from '@/hooks/useLocation'
import { useWorkspaceSync } from '@/hooks/useWorkspaceSync'
import { useDocumentStore } from '@/store/documentStore'

export function App() {
	const mapRef = useRef<MapRef>(null)
	const hydrated = useDocumentStore((s) => s.hydrated)
	const userLocation = useLocation()
	useWorkspaceSync()

	return (
		<TooltipProvider>
			<AuthGate>
				{hydrated ? (
					<div className="relative h-svh w-screen overflow-hidden bg-background text-foreground">
						{/* Map under chrome; must sit inside AppSidebarProvider for padding sync. */}
						<AppSidebarProvider className="pointer-events-none relative z-10 h-svh min-h-0 bg-transparent">
							<div className="pointer-events-auto absolute inset-0 z-0">
								<MapView mapRef={mapRef} userLocation={userLocation} />
							</div>

							<AppSidebar mapRef={mapRef} />

							{/* Offset by sidebar width; transparent so the map shows through. */}
							<SidebarInset className="pointer-events-none min-h-0 bg-transparent">
								<SidebarToggleButton variant="overlay" />
								<LocateButton
									mapRef={mapRef}
									userLocation={userLocation}
									className="pointer-events-auto absolute right-4 bottom-4 z-20"
								/>
								<div className="pointer-events-auto">
									<PlaceDetail mapRef={mapRef} />
								</div>
							</SidebarInset>
						</AppSidebarProvider>
					</div>
				) : (
					<div className="flex h-svh w-screen items-center justify-center bg-background text-sm text-muted-foreground">
						Loading workspace…
					</div>
				)}
			</AuthGate>
			<Toaster position="bottom-right" />
		</TooltipProvider>
	)
}
