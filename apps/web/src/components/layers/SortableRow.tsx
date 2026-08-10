import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    ChevronRightIcon,
    EllipsisVerticalIcon,
    EyeIcon,
    EyeSlashIcon,
} from '@heroicons/react/24/outline';
import type { DocNode, NodeId } from '@map-layers/domain';
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

export type SortableRowProps = {
    node: DocNode;
    id: NodeId;
    depth: number;
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
};

export function SortableRow({
    node,
    id,
    depth,
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

    return (
        <li
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                paddingLeft: depth * 32,
            }}
            className={cn(
                'group/row relative rounded-lg',
                !editing && 'cursor-grab active:cursor-grabbing',
                selected && 'bg-accent/80',
                isDragging && 'opacity-60',
            )}
            {...attributes}
            {...listeners}
        >
            <div className='flex items-center gap-1 px-1 py-1'>
                {isLayer ? (
                    <>
                        <button
                            type='button'
                            className='flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground'
                            onClick={onToggleCollapsed}
                            aria-label={node.collapsed ? 'Expand' : 'Collapse'}
                            aria-expanded={!node.collapsed}
                        >
                            <ChevronRightIcon
                                className={cn(
                                    'h-3.5 w-3.5 transition-transform duration-200 ease-out',
                                    !node.collapsed && 'rotate-90',
                                )}
                                aria-hidden
                            />
                        </button>

                        <LayerStylePicker
                            color={node.color}
                            maki={node.maki}
                            open={styleOpen}
                            onOpenChange={onStyleOpenChange}
                            onPickColor={onPickColor}
                            onPickMaki={onPickMaki}
                        />
                    </>
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
                {isLayer ? (
                    <button
                        type='button'
                        onClick={onToggleVisible}
                        className={cn(
                            'flex size-5 shrink-0 items-center justify-center rounded opacity-0 transition-opacity duration-100 ease-out group-hover/row:opacity-100 focus-visible:opacity-100',
                            node.visible
                                ? 'text-foreground hover:text-foreground'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                        aria-label={node.visible ? 'Hide layer' : 'Show layer'}
                        aria-pressed={node.visible}
                        title={node.visible ? 'Hide' : 'Show'}
                    >
                        {node.visible ? (
                            <EyeIcon className='size-4' aria-hidden />
                        ) : (
                            <EyeSlashIcon className='size-4' aria-hidden />
                        )}
                    </button>
                ) : null}
                <DropdownMenu open={menuOpen} onOpenChange={onMenuOpenChange}>
                    <DropdownMenuTrigger
                        render={
                            <Button
                                type='button'
                                variant='ghost'
                                size='icon-sm'
                                className=''
                                aria-label='More'
                            >
                                <EllipsisVerticalIcon
                                    className='size-4'
                                    aria-hidden
                                />
                            </Button>
                        }
                    />
                    <DropdownMenuContent align='end' className='min-w-35'>
                        {isLayer ? (
                            <>
                                <DropdownMenuItem onClick={onCreateSublayer}>
                                    New sublayer
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={onUngroup}>
                                    Ungroup
                                </DropdownMenuItem>
                            </>
                        ) : null}
                        <DropdownMenuItem onClick={onStartEdit}>
                            Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onFit}>
                            Fit to map
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            variant='destructive'
                            onClick={onDelete}
                        >
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </li>
    );
}
