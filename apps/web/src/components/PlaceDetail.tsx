import { getParentId } from '@map-layers/domain';
import {
    FrameCornersIcon,
    PencilSimpleIcon,
    PolygonIcon,
    TrashIcon,
    XIcon,
} from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import type { MapRef } from 'react-map-gl';
import { IsochroneDialog } from '@/components/isochrone/IsochroneDialog';
import { ConfirmModal, PromptModal } from '@/components/modals';
import { Button } from '@/components/ui/button';
import { useIsochroneCreate } from '@/hooks/useIsochroneCreate';
import { fitToCoordinates } from '@/lib/mapCamera';
import { useDocumentStore } from '@/store/documentStore';

const renameIconTransition = { duration: 0.15, ease: 'easeOut' } as const;

type PlaceDetailProps = {
    mapRef: React.RefObject<MapRef | null>;
};

export function PlaceDetail({ mapRef }: PlaceDetailProps) {
    const selectedPlaceId = useDocumentStore((s) => s.selectedPlaceId);
    const document = useDocumentStore((s) => s.document);
    const selectPlace = useDocumentStore((s) => s.selectPlace);
    const renameNode = useDocumentStore((s) => s.renameNode);
    const deleteNodes = useDocumentStore((s) => s.deleteNodes);

    const isochrone = useIsochroneCreate();
    const [renameOpen, setRenameOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [renameHovered, setRenameHovered] = useState(false);

    const place =
        selectedPlaceId && document.nodes[selectedPlaceId]?.kind === 'place'
            ? document.nodes[selectedPlaceId]
            : null;
    const placeId =
        place?.kind === 'place' && selectedPlaceId ? selectedPlaceId : null;
    const modalOpen =
        renameOpen || deleteOpen || isochrone.dialogOpen;

    useEffect(() => {
        if (!placeId || modalOpen) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            selectPlace(null);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [placeId, modalOpen, selectPlace]);

    return (
        <>
            <AnimatePresence>
                {place?.kind === 'place' && placeId ? (
                    <motion.div
                        key='place-detail'
                        initial={{
                            opacity: 0,
                            y: 16,
                            scale: 0.95,
                        }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{
                            opacity: 0,
                            y: -4,
                            scale: 1.02,
                            filter: 'blur(4px)',
                        }}
                        transition={{ duration: 0.2 }}
                        className='absolute right-4 bottom-16 left-4 z-20 mx-auto max-w-md rounded-xl border border-border bg-card/95 p-4 text-card-foreground shadow-2xl backdrop-blur'
                    >
                        <div className='mb-1 flex items-start justify-between gap-3'>
                            <h2 className='min-w-0 flex-1 font-heading text-sm font-semibold'>
                                <button
                                    type='button'
                                    className='relative flex min-w-0 max-w-full items-center rounded-md text-left outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring'
                                    onClick={() => setRenameOpen(true)}
                                    onPointerEnter={() =>
                                        setRenameHovered(true)
                                    }
                                    onPointerLeave={() =>
                                        setRenameHovered(false)
                                    }
                                    onFocus={() => setRenameHovered(true)}
                                    onBlur={() => setRenameHovered(false)}
                                    aria-label='Rename'
                                    title='Rename'
                                >
                                    <span className='min-w-0 truncate'>
                                        {place.name}
                                    </span>
                                    <span
                                        className='pointer-events-none absolute top-1/2 left-full ml-1 size-3 -translate-y-1/2 overflow-hidden'
                                        aria-hidden
                                    >
                                        <AnimatePresence initial={false}>
                                            {renameHovered ? (
                                                <motion.span
                                                    key='rename-icon'
                                                    initial={{
                                                        x: '-100%',
                                                        opacity: 0,
                                                        scale: 0.7,
                                                    }}
                                                    animate={{
                                                        x: 0,
                                                        opacity: 1,
                                                        scale: 1,
                                                    }}
                                                    exit={{
                                                        x: '-100%',
                                                        opacity: 0,
                                                        scale: 0.7,
                                                    }}
                                                    transition={
                                                        renameIconTransition
                                                    }
                                                    className='absolute inset-0 flex items-center justify-center text-muted-foreground'
                                                >
                                                    <PencilSimpleIcon className='size-3' />
                                                </motion.span>
                                            ) : null}
                                        </AnimatePresence>
                                    </span>
                                </button>
                            </h2>
                            <Button
                                type='button'
                                variant='ghost'
                                size='icon-xs'
                                className='shrink-0 text-muted-foreground hover:text-foreground'
                                onClick={() => selectPlace(null)}
                                aria-label='Close'
                                title='Close'
                            >
                                <XIcon className='size-3.5' aria-hidden />
                            </Button>
                        </div>
                        {place.address ? (
                            <p className='text-xs text-muted-foreground'>
                                {place.address}
                            </p>
                        ) : null}
                        {place.featureType ? (
                            <p className='mt-2 text-[11px] tracking-wide text-muted-foreground uppercase'>
                                {place.featureType}
                            </p>
                        ) : null}
                        <div className='mt-3 flex items-center justify-between border-t border-border pt-3'>
                            <div className='flex items-center gap-1'>
                                <Button
                                    type='button'
                                    variant='ghost'
                                    size='icon-sm'
                                    onClick={() => {
                                        isochrone.openForPlace(
                                            {
                                                lng: place.coordinates.lng,
                                                lat: place.coordinates.lat,
                                                label: place.name,
                                            },
                                            placeId,
                                            getParentId(document, placeId),
                                        );
                                    }}
                                    aria-label='Add Isochrone'
                                    title='Add Isochrone'
                                >
                                    <PolygonIcon
                                        className='size-4'
                                        aria-hidden
                                    />
                                </Button>
                                <Button
                                    type='button'
                                    variant='ghost'
                                    size='icon-sm'
                                    onClick={() => {
                                        fitToCoordinates(
                                            mapRef,
                                            [place.coordinates],
                                            {
                                                padding: 60,
                                                duration: 700,
                                            },
                                        );
                                    }}
                                    aria-label='Fit to Map'
                                    title='Fit to Map'
                                >
                                    <FrameCornersIcon
                                        className='size-4'
                                        aria-hidden
                                    />
                                </Button>
                            </div>
                            <Button
                                type='button'
                                variant='ghost'
                                size='icon-sm'
                                onClick={() => setDeleteOpen(true)}
                                aria-label='Delete'
                                title='Delete'
                            >
                                <TrashIcon className='size-4' aria-hidden />
                            </Button>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            {place?.kind === 'place' && placeId ? (
                <>
                    <PromptModal
                        open={renameOpen}
                        title='Rename'
                        label='Name'
                        initialValue={place.name}
                        confirmLabel='Save'
                        onCancel={() => setRenameOpen(false)}
                        onConfirm={(name) => {
                            renameNode(placeId, name);
                            setRenameOpen(false);
                        }}
                    />

                    <ConfirmModal
                        open={deleteOpen}
                        title={`Delete "${place.name}"?`}
                        message='Are you sure you want to delete this place? This cannot be undone.'
                        confirmLabel='Delete Place'
                        onCancel={() => setDeleteOpen(false)}
                        onConfirm={() => {
                            deleteNodes([placeId]);
                            setDeleteOpen(false);
                            selectPlace(null);
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
            ) : null}
        </>
    );
}
