import { useEffect, useMemo, useState } from 'react';
import { type ColorResult, GithubPicker } from 'react-color';
import { PhosphorPlaceIcon } from '@/components/icons/PhosphorPlaceIcon';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { COLOR_PALETTE } from '@/lib/constants';
import { PLACE_ICON_NAMES } from '@/lib/googlePlaceIcon';
import { cn } from '@/lib/utils';

type LayerStylePickerProps = {
    color: string;
    maki: string | undefined;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPickColor: (color: string) => void;
    onPickMaki: (maki: string | undefined) => void;
    /** When false, only the color palette is shown (isochrones). Default true. */
    showIcons?: boolean;
};

export function LayerStylePicker({
    color,
    maki,
    open,
    onOpenChange,
    onPickColor,
    onPickMaki,
    showIcons = true,
}: LayerStylePickerProps) {
    const [iconFilter, setIconFilter] = useState('');

    useEffect(() => {
        if (!open) setIconFilter('');
    }, [open]);

    const filteredIcons = useMemo(() => {
        const q = iconFilter.trim().toLowerCase();
        if (!q) return PLACE_ICON_NAMES;
        return PLACE_ICON_NAMES.filter((name) =>
            name.toLowerCase().includes(q),
        );
    }, [iconFilter]);

    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger
                className='flex size-5 shrink-0 items-center justify-center'
                aria-label={showIcons ? 'Layer color and icon' : 'Color'}
                title={
                    showIcons
                        ? maki
                            ? `Icon: ${maki}`
                            : 'Set layer color and icon'
                        : 'Set color'
                }
            >
                {showIcons ? (
                    <PhosphorPlaceIcon
                        name={maki}
                        color={color}
                        className='size-4'
                    />
                ) : (
                    <span
                        className='size-4 rounded-sm border border-border'
                        style={{ backgroundColor: color }}
                        aria-hidden
                    />
                )}
            </PopoverTrigger>
            <PopoverContent align='start' className='w-auto gap-2 p-2'>
                <GithubPicker
                    color={color}
                    colors={[...COLOR_PALETTE]}
                    triangle='hide'
                    onChange={(result: ColorResult) => onPickColor(result.hex)}
                    styles={{
                        default: {
                            card: {
                                boxShadow: 'none',
                                padding: 0,
                                background: 'transparent',
                                width: 'auto',
                            },
                        },
                    }}
                />

                {showIcons ? (
                    <>
                        <div className='h-px bg-border' />

                        <Input
                            value={iconFilter}
                            onChange={(e) => setIconFilter(e.target.value)}
                            placeholder='Search icons…'
                            className='h-7 text-xs'
                        />
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
                                        maki === name &&
                                            'border-ring bg-accent',
                                    )}
                                >
                                    <PhosphorPlaceIcon
                                        name={name}
                                        color={color}
                                        className='h-3.5 w-3.5'
                                    />
                                </button>
                            ))}
                        </div>
                    </>
                ) : null}
            </PopoverContent>
        </Popover>
    );
}
