import { useEffect, useMemo, useState } from 'react';
import { MakiGlyph } from '@/components/icons/MakiGlyph';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { COLOR_PALETTE } from '@/lib/constants';
import { MAKI_ICON_NAMES } from '@/lib/makiIcon';
import { cn } from '@/lib/utils';

type LayerStylePickerProps = {
    color: string;
    maki: string | undefined;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPickColor: (color: string) => void;
    onPickMaki: (maki: string | undefined) => void;
};

export function LayerStylePicker({
    color,
    maki,
    open,
    onOpenChange,
    onPickColor,
    onPickMaki,
}: LayerStylePickerProps) {
    const [iconFilter, setIconFilter] = useState('');

    useEffect(() => {
        if (!open) setIconFilter('');
    }, [open]);

    const filteredIcons = useMemo(() => {
        const q = iconFilter.trim().toLowerCase();
        if (!q) return MAKI_ICON_NAMES;
        return MAKI_ICON_NAMES.filter((name) => name.includes(q));
    }, [iconFilter]);

    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger
                className='flex size-5 shrink-0 items-center justify-center rounded-full border border-border bg-background/60'
                aria-label='Layer color and icon'
                title={maki ? `Icon: ${maki}` : 'Set layer color and icon'}
            >
                <MakiGlyph maki={maki} color={color} className='h-3 w-3' />
            </PopoverTrigger>
            <PopoverContent align='start' className='w-56 gap-2 p-2'>
                <div className='grid grid-cols-5 gap-1'>
                    {COLOR_PALETTE.map((swatch) => (
                        <button
                            key={swatch}
                            type='button'
                            className={cn(
                                'h-5 w-5 rounded-sm border border-border',
                                color === swatch &&
                                    'ring-2 ring-ring ring-offset-1 ring-offset-popover',
                            )}
                            style={{ backgroundColor: swatch }}
                            onClick={() => onPickColor(swatch)}
                            aria-label={swatch}
                            aria-pressed={color === swatch}
                        />
                    ))}
                </div>

                <div className='h-px bg-border' />

                <Input
                    value={iconFilter}
                    onChange={(e) => setIconFilter(e.target.value)}
                    placeholder='Filter icons…'
                    className='h-7 text-[11px]'
                />
                <Button
                    type='button'
                    variant={!maki ? 'secondary' : 'ghost'}
                    size='xs'
                    onClick={() => onPickMaki(undefined)}
                    className='w-full justify-start'
                >
                    Auto (place icons)
                </Button>
                <div className='grid max-h-40 grid-cols-6 gap-1 overflow-y-auto'>
                    {filteredIcons.map((name) => (
                        <button
                            key={name}
                            type='button'
                            title={name}
                            aria-label={name}
                            onClick={() => onPickMaki(name)}
                            className={cn(
                                'flex h-7 w-7 items-center justify-center rounded border border-transparent hover:border-border hover:bg-accent',
                                maki === name && 'border-ring bg-accent',
                            )}
                        >
                            <MakiGlyph
                                maki={name}
                                color={color}
                                className='h-3.5 w-3.5'
                            />
                        </button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}
