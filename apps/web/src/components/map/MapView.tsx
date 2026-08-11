import { listVisibleIsochrones, listVisiblePlaces } from '@map-layers/domain';
import { useMemo } from 'react';
import type { MapRef } from 'react-map-gl';
import { Layer, Map as MapboxMap, Source } from 'react-map-gl';
import { PlaceMarker } from '@/components/map/PlaceMarker';
import { UserLocationMarker } from '@/components/map/UserLocationMarker';
import { useFlyToUserOnce } from '@/hooks/useFlyToUserOnce';
import type { LocationState } from '@/hooks/useLocation';
import { useMapSidebarPadding } from '@/hooks/useMapSidebarPadding';
import {
    DEFAULT_CENTER,
    DEFAULT_ZOOM,
    getMapboxToken,
    MAP_STYLE,
} from '@/lib/constants';
import { useDocumentStore } from '@/store/documentStore';

type MapViewProps = {
    mapRef: React.RefObject<MapRef | null>;
    userLocation: LocationState;
    onMoveEnd?: () => void;
};

function hexToRgba(hex: string, alpha: number): string {
    const raw = hex.replace('#', '');
    const full =
        raw.length === 3
            ? raw
                  .split('')
                  .map((c) => c + c)
                  .join('')
            : raw;
    const n = Number.parseInt(full, 16);
    if (Number.isNaN(n) || full.length !== 6)
        return `rgba(31, 1, 185, ${alpha})`;
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function MapView({ mapRef, userLocation, onMoveEnd }: MapViewProps) {
    const document = useDocumentStore((s) => s.document);
    const selectedNodeIds = useDocumentStore((s) => s.selectedNodeIds);
    const selectedPlaceId = useDocumentStore((s) => s.selectedPlaceId);
    const selectPlace = useDocumentStore((s) => s.selectPlace);
    const searchPreview = useDocumentStore((s) => s.searchPreview);
    const toggleSearchSelection = useDocumentStore(
        (s) => s.toggleSearchSelection,
    );
    const { markUserInteracted } = useFlyToUserOnce(mapRef, userLocation);
    const { mapPadding, onMapReady } = useMapSidebarPadding(mapRef);

    const visiblePlaces = useMemo(
        () => listVisiblePlaces(document),
        [document],
    );
    const visibleIsochrones = useMemo(
        () => listVisibleIsochrones(document),
        [document],
    );

    return (
        <div className='relative h-full w-full'>
            <MapboxMap
                ref={mapRef}
                mapStyle={MAP_STYLE}
                mapboxAccessToken={getMapboxToken()}
                initialViewState={{
                    latitude: DEFAULT_CENTER.lat,
                    longitude: DEFAULT_CENTER.lng,
                    zoom: DEFAULT_ZOOM,
                    padding: mapPadding,
                }}
                reuseMaps
                attributionControl={false}
                onLoad={onMapReady}
                onClick={() => selectPlace(null)}
                onMoveStart={(e) => {
                    if (e.originalEvent) markUserInteracted();
                }}
                onMoveEnd={onMoveEnd}
                style={{ width: '100%', height: '100%' }}
            >
                {visibleIsochrones.map(({ isochrone, color }) => {
                    const selected = selectedNodeIds.includes(isochrone.id);
                    return (
                        <Source
                            key={isochrone.id}
                            id={`isochrone-${isochrone.id}`}
                            type='geojson'
                            data={
                                isochrone.geojson as GeoJSON.FeatureCollection
                            }
                        >
                            <Layer
                                id={`isochrone-fill-${isochrone.id}`}
                                type='fill'
                                paint={{
                                    'fill-color': hexToRgba(
                                        color,
                                        selected ? 0.2 : 0.1,
                                    ),
                                    'fill-opacity': 1,
                                }}
                            />
                            <Layer
                                id={`isochrone-line-${isochrone.id}`}
                                type='line'
                                paint={{
                                    'line-color': color,
                                    'line-width': selected ? 2 : 1.5,
                                    'line-opacity': selected ? 0.9 : 0.5,
                                }}
                            />
                        </Source>
                    );
                })}
                {visiblePlaces.map(({ place, color, maki }) => (
                    <PlaceMarker
                        key={place.id}
                        id={place.id}
                        label={place.name}
                        latitude={place.coordinates.lat}
                        longitude={place.coordinates.lng}
                        color={color}
                        maki={maki}
                        selected={selectedPlaceId === place.id}
                        onClick={selectPlace}
                    />
                ))}
                {searchPreview?.results.map((result) => (
                    <PlaceMarker
                        key={`search-${result.mapboxId}`}
                        id={result.mapboxId}
                        label={result.name}
                        latitude={result.coordinates.lat}
                        longitude={result.coordinates.lng}
                        color={searchPreview.color}
                        maki={result.maki}
                        selected={searchPreview.selectedMapboxIds.includes(
                            result.mapboxId,
                        )}
                        onClick={toggleSearchSelection}
                    />
                ))}
                <UserLocationMarker userLocation={userLocation} />
            </MapboxMap>
        </div>
    );
}
