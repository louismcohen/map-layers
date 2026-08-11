import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DocNode, NodeId } from '@map-layers/domain';
import type { IsochroneProfile } from '@map-layers/domain';
import {
    CaretRightIcon,
    CarProfileIcon,
    DotsThreeVerticalIcon,
    EyeIcon,
    EyeSlashIcon,
    type Icon,
    PersonSimpleBikeIcon,
    PersonSimpleWalkIcon,
} from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { LayerStylePicker } from '@/components/layers/LayerStylePicker';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const rowHeightTransition = {
    duration: 0.2,
    ease: [0.22, 1, 0.36, 1] as const,
};

const ISOCHRONE_PROFILE_ICON: Record<IsochroneProfile, Icon> = {
    driving: CarProfileIcon,
    cycling: PersonSimpleBikeIcon,
    walking: PersonSimpleWalkIcon,
};

export type SortableRowProps = {
    node: DocNode;
    id: NodeId;
    depth: number;
    /** True when this row is a root child (isochrones get color controls). */
    isRoot: boolean;
    /** Place with attached isochrones — show collapse caret. */
    placeCollapsible?: boolean;
    /** UI-only collapse for places with attachments. */
    placeCollapsed?: boolean;
    selected: boolean;
    editing: boolean;
    menuOpen: boolean;
    styleOpen: boolean;
    onSelect: () => void;
    onToggleVisible: () => void;
    onToggleCollapsed: () => void;
    onStartEdit: () => void;
    onCommitEdit: (name: string) => void;
    onCancelEdit: () => void;
    onMenuOpenChange: (open: boolean) => void;
    onStyleOpenChange: (open: boolean) => void;
    onPickColor: (color: string) => void;
    onPickMaki: (maki: string | undefined) => void;
    onUngroup: () => void;
    onDelete: () => void;
    onFit: () => void;
    onCreateSublayer: () => void;
    onAddIsochrone: () => void;
};

export function SortableRow({
    node,
    id,
    depth,
    isRoot,
    placeCollapsible = false,
    placeCollapsed = false,
    selected,
    editing,
    menuOpen,
    styleOpen,
    onSelect,
    onToggleVisible,
    onToggleCollapsed,
    onStartEdit,
    onCommitEdit,
    onCancelEdit,
    onMenuOpenChange,
    onStyleOpenChange,
    onPickColor,
    onPickMaki,
    onUngroup,
    onDelete,
    onFit,
    onCreateSublayer,
    onAddIsochrone,
}: SortableRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id,
        disabled: editing,
    });
    const [draft, setDraft] = useState(node.name);

    useEffect(() => {
        if (editing) setDraft(node.name);
    }, [node.name, editing]);

    const isLayer = node.kind === 'layer';
    const isIsochrone = node.kind === 'isochrone';
    const isPlace = node.kind === 'place';
    const showStyle = isLayer || (isIsochrone && isRoot);
    const showVisibility = isLayer || isIsochrone;
    const visible = isLayer || isIsochrone ? node.visible : true;
    const IsochroneProfileIcon = isIsochrone
        ? ISOCHRONE_PROFILE_ICON[node.profile]
        : null;

    return (
        // Sortable transform must live on this overflow-hidden wrapper: translating
        // an inner child gets clipped when siblings shift during reorder.
        <motion.li
            ref={setNodeRef}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: isDragging ? 0.6 : 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={rowHeightTransition}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
            }}
            className='overflow-hidden'
            {...attributes}
            {...listeners}
        >
            <div
                style={{
                    paddingLeft: depth * 32,
                }}
                className={cn(
                    'group/row relative mb-0.5 rounded-lg',
                    !editing && 'cursor-grab active:cursor-grabbing',
                    selected && 'bg-accent/80',
                )}
            >
                <div className='flex items-center gap-1 px-1 py-1'>
                    {isLayer || (isPlace && placeCollapsible) ? (
                        <button
                            type='button'
                            className='flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground'
                            onClick={onToggleCollapsed}
                            aria-label={
                                (isLayer ? node.collapsed : placeCollapsed)
                                    ? 'Expand'
                                    : 'Collapse'
                            }
                            aria-expanded={
                                !(isLayer ? node.collapsed : placeCollapsed)
                            }
                        >
                            <CaretRightIcon
                                className={cn(
                                    'h-3.5 w-3.5 transition-transform duration-200 ease-out',
                                    !(isLayer ? node.collapsed : placeCollapsed) &&
                                        'rotate-90',
                                )}
                                aria-hidden
                            />
                        </button>
                    ) : IsochroneProfileIcon ? (
                        <span
                            className='flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground'
                            aria-hidden
                        >
                            <IsochroneProfileIcon
                                weight='fill'
                                className='h-3.5 w-3.5'
                            />
                        </span>
                    ) : (
                        <span className='h-5 w-5 shrink-0' aria-hidden />
                    )}

                    {showStyle ? (
                        <LayerStylePicker
                            color={node.color}
                            maki={isLayer ? node.maki : undefined}
                            open={styleOpen}
                            onOpenChange={onStyleOpenChange}
                            onPickColor={onPickColor}
                            onPickMaki={onPickMaki}
                            showIcons={isLayer}
                        />
                    ) : null}

                    {editing ? (
                        <Input
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onBlur={() => {
                                if (draft.trim()) onCommitEdit(draft);
                                else onCancelEdit();
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && draft.trim())
                                    onCommitEdit(draft);
                                if (e.key === 'Escape') onCancelEdit();
                            }}
                            className='h-6 min-w-0 flex-1 rounded-md px-1 text-xs'
                        />
                    ) : (
                        <button
                            type='button'
                            onClick={onSelect}
                            onDoubleClick={onStartEdit}
                            className='flex min-w-0 flex-1 items-center self-stretch text-left text-xs text-foreground'
                        >
                            <span className='truncate'>{node.name}</span>
                        </button>
                    )}
                    {showVisibility ? (
                        <button
                            type='button'
                            onClick={onToggleVisible}
                            className={cn(
                                'flex size-5 shrink-0 items-center justify-center rounded opacity-0 transition-opacity duration-100 ease-out group-hover/row:opacity-100 focus-visible:opacity-100',
                                visible
                                    ? 'text-foreground'
                                    : 'text-muted-foreground',
                            )}
                            aria-label={visible ? 'Hide' : 'Show'}
                            aria-pressed={visible}
                            title={visible ? 'Hide' : 'Show'}
                        >
                            {visible ? (
                                <EyeIcon className='size-4' aria-hidden />
                            ) : (
                                <EyeSlashIcon className='size-4' aria-hidden />
                            )}
                        </button>
                    ) : null}
                    <DropdownMenu
                        open={menuOpen}
                        onOpenChange={onMenuOpenChange}
                    >
                        <DropdownMenuTrigger
                            render={
                                <Button
                                    type='button'
                                    variant='ghost'
                                    size='icon-sm'
                                    className=''
                                    aria-label='More'
                                >
                                    <DotsThreeVerticalIcon
                                        className='size-4'
                                        aria-hidden
                                    />
                                </Button>
                            }
                        />
                        <DropdownMenuContent align='end' className='min-w-35'>
                            {isLayer ? (
                                <>
                                    <DropdownMenuItem
                                        onClick={onCreateSublayer}
                                    >
                                        New sublayer
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={onUngroup}>
                                        Ungroup
                                    </DropdownMenuItem>
                                </>
                            ) : null}
                            {isPlace ? (
                                <DropdownMenuItem onClick={onAddIsochrone}>
                                    Add Isochrone…
                                </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem onClick={onStartEdit}>
                                Rename
                            </DropdownMenuItem>
                            {!isIsochrone ? (
                                <DropdownMenuItem onClick={onFit}>
                                    Fit to Map
                                </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem
                                variant='destructive'
                                onClick={onDelete}
                            >
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </motion.li>
    );
}
