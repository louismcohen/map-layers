import { PolygonIcon, XIcon } from '@phosphor-icons/react';
import type { MapRef } from 'react-map-gl';
import { IsochroneDialog } from '@/components/isochrone/IsochroneDialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useIsochroneCreate } from '@/hooks/useIsochroneCreate';
import { usePlaceSearch } from '@/hooks/usePlaceSearch';
import { cn } from '@/lib/utils';

type SearchPanelProps = {
    mapRef: React.RefObject<MapRef | null>;
};

export function SearchPanel({ mapRef }: SearchPanelProps) {
    const {
        query,
        setQuery,
        loading,
        adding,
        error,
        destination,
        setDestination,
        newLayerName,
        setNewLayerName,
        layers,
        results,
        selected,
        searchPreview,
        nextPageToken,
        toggleSearchSelection,
        selectAll,
        addSelected,
        loadMore,
        loadingMore,
    } = usePlaceSearch(mapRef);

    const isochrone = useIsochroneCreate();

    const destValue =
        destination.mode === 'layer'
            ? `layer:${destination.layerId}`
            : destination.mode;

    // Base UI Select.Value shows the raw value unless `items` maps value → label.
    const destItems = [
        { value: 'new-layer', label: 'New layer' },
        { value: 'root', label: 'Top level' },
        ...layers.map((layer) => ({
            value: `layer:${layer.id}`,
            label: layer.name,
        })),
    ];

    return (
        <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
            <div className='shrink-0 border-b border-sidebar-border p-3'>
                <div className='mb-2 flex items-center justify-between gap-2'>
                    <h1 className='font-heading text-sm font-semibold tracking-wide'>
                        Search Places
                    </h1>
                    {/* <h2 className='text-xs font-semibold tracking-wide text-muted-foreground uppercase'>
                        Search places
                    </h2> */}
                    {searchPreview ? (
                        <span
                            className='inline-flex items-center gap-1.5 text-[11px] text-muted-foreground'
                            title='Preview / new-layer color'
                        >
                            <span
                                className='h-3 w-3 rounded-sm border border-border'
                                style={{ backgroundColor: searchPreview.color }}
                            />
                            Pin color
                        </span>
                    ) : null}
                </div>
                <div className='relative'>
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder='Coffee, supermarkets, addresses…'
                        className={query ? 'pr-8' : undefined}
                    />
                    {query ? (
                        <Button
                            type='button'
                            variant='ghost'
                            size='icon-xs'
                            className='absolute top-1/2 right-2 -translate-y-1/2 text-foreground hover:bg-ring/20'
                            onClick={() => setQuery('')}
                            aria-label='Clear search'
                        >
                            <XIcon className='size-4' />
                        </Button>
                    ) : null}
                </div>
            </div>

            <div className='min-h-0 flex-1 overflow-y-auto px-2 py-2'>
                {loading ? (
                    <p className='px-1 py-2 text-xs text-muted-foreground'>
                        Searching…
                    </p>
                ) : null}
                {error ? (
                    <p className='px-1 py-2 text-xs text-destructive'>
                        {error}
                    </p>
                ) : null}
                {!loading && query && results.length === 0 && !error ? (
                    <p className='px-1 py-2 text-xs text-muted-foreground'>
                        No results
                    </p>
                ) : null}
                <ul className='space-y-1'>
                    {results.map((result) => {
                        const checked = selected.has(result.mapboxId);
                        return (
                            <li
                                key={result.mapboxId}
                                className='flex items-start gap-0.5'
                            >
                                {/* Checkbox is the control; label wraps the row for hit target. */}
                                {/* biome-ignore lint/a11y/noLabelWithoutControl: wraps Checkbox primitive */}
                                <label
                                    className={cn(
                                        'flex min-w-0 flex-1 cursor-pointer gap-2 rounded-lg px-2 py-1.5 hover:bg-accent/80',
                                        checked && 'bg-accent',
                                    )}
                                >
                                    <Checkbox
                                        checked={checked}
                                        onCheckedChange={() =>
                                            toggleSearchSelection(
                                                result.mapboxId,
                                            )
                                        }
                                        className='mt-0.5'
                                    />
                                    {searchPreview ? (
                                        <span
                                            className='mt-1 h-2.5 w-2.5 shrink-0 rounded-full border border-border'
                                            style={{
                                                backgroundColor:
                                                    searchPreview.color,
                                            }}
                                        />
                                    ) : null}
                                    <span className='min-w-0'>
                                        <span className='block truncate text-xs text-foreground'>
                                            {result.name}
                                        </span>
                                        {result.address ? (
                                            <span className='block truncate text-[11px] text-muted-foreground'>
                                                {result.address}
                                            </span>
                                        ) : null}
                                    </span>
                                </label>
                                <Button
                                    type='button'
                                    variant='ghost'
                                    size='icon-xs'
                                    className='mt-1 shrink-0 text-muted-foreground hover:text-foreground'
                                    aria-label={`Add isochrone for ${result.name}`}
                                    title='Add Isochrone'
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        isochrone.openForSearch({
                                            lng: result.coordinates.lng,
                                            lat: result.coordinates.lat,
                                            label: result.name,
                                        });
                                    }}
                                >
                                    <PolygonIcon
                                        weight='fill'
                                        className='size-4'
                                    />
                                </Button>
                            </li>
                        );
                    })}
                </ul>
                {nextPageToken && !loading ? (
                    <div className='px-1 pt-2'>
                        <Button
                            type='button'
                            variant='ghost'
                            size='xs'
                            className='w-full'
                            disabled={loadingMore}
                            onClick={loadMore}
                        >
                            {loadingMore ? 'Loading…' : 'Load more'}
                        </Button>
                    </div>
                ) : null}
            </div>

            {results.length > 0 ? (
                <div className='shrink-0 space-y-2 border-t border-sidebar-border px-3 py-2'>
                    <div className='flex items-center gap-2'>
                        <Button
                            type='button'
                            variant='ghost'
                            size='xs'
                            onClick={selectAll}
                        >
                            Select all
                        </Button>
                        <span className='text-xs text-muted-foreground'>
                            {selected.size} selected
                        </span>
                    </div>

                    <Label
                        className='text-[11px] text-muted-foreground'
                        htmlFor='add-dest'
                    >
                        Add to
                    </Label>
                    <Select
                        value={destValue}
                        items={destItems}
                        onValueChange={(value) => {
                            if (value == null) return;
                            if (value === 'root')
                                setDestination({ mode: 'root' });
                            else if (value === 'new-layer')
                                setDestination({ mode: 'new-layer' });
                            else if (value.startsWith('layer:'))
                                setDestination({
                                    mode: 'layer',
                                    layerId: value.slice(6),
                                });
                        }}
                    >
                        <SelectTrigger
                            id='add-dest'
                            className='w-full'
                            size='sm'
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value='new-layer'>New layer</SelectItem>
                            <SelectItem value='root'>Top level</SelectItem>
                            {layers.map((layer) => (
                                <SelectItem
                                    key={layer.id}
                                    value={`layer:${layer.id}`}
                                >
                                    {layer.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {destination.mode === 'new-layer' ? (
                        <Input
                            value={newLayerName}
                            onChange={(e) => setNewLayerName(e.target.value)}
                            placeholder='Layer name'
                            className='h-7 text-xs'
                        />
                    ) : null}

                    <Button
                        type='button'
                        disabled={selected.size === 0 || adding}
                        onClick={addSelected}
                        className='w-full'
                        size='sm'
                    >
                        {adding ? 'Adding…' : 'Add selected'}
                    </Button>
                </div>
            ) : null}

            <IsochroneDialog
                open={isochrone.dialogOpen}
                center={isochrone.pending?.center ?? null}
                submitting={isochrone.submitting}
                onCancel={isochrone.cancel}
                onConfirm={isochrone.confirm}
            />
        </div>
    );
}
