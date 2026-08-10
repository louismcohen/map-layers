import { motion } from 'motion/react';
import { memo } from 'react';
import { Marker } from 'react-map-gl';
import { MakiGlyph } from '@/components/icons/MakiGlyph';
import { cn } from '@/lib/utils';

const iconFill = '#ffffff';

type PlaceMarkerVariant = 'outline' | 'filled';

type PlaceMarkerProps = {
    id: string;
    label: string;
    latitude: number;
    longitude: number;
    color: string;
    selected: boolean;
    maki?: string;
    variant?: PlaceMarkerVariant;
    onClick: (id: string) => void;
};

function PlaceMarkerComponent({
    id,
    label,
    latitude,
    longitude,
    color,
    selected,
    maki,
    variant = 'filled',
    onClick,
}: PlaceMarkerProps) {
    const filled = variant === 'filled';

    return (
        <Marker
            latitude={latitude}
            longitude={longitude}
            onClick={(e) => {
                e.originalEvent.stopPropagation();
                onClick(id);
            }}
            style={{ zIndex: selected ? 2 : 1 }}
        >
            <div
                className='relative pop-in'
                style={{
                    ['--delay-time' as string]: `${Math.random() * 0.25}s`,
                }}
            >
                <motion.div
                    className={cn(
                        'flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border backdrop-blur-md',
                        !filled &&
                            'bg-linear-to-t from-neutral-200/95 via-neutral-200/95 to-neutral-50/95',
                    )}
                    style={{
                        backgroundColor: filled ? `${color}F2` : undefined,
                        borderColor: filled ? 'rgba(255,255,255,0.1)' : color,
                        borderWidth: 1,
                        boxShadow: selected
                            ? `0px 0px 5px 2px ${color}60, 0px 3px 5px rgba(0,0,0,0.33)`
                            : '0px 3px 5px rgba(0,0,0,0.33)',
                    }}
                    animate={{ scale: selected ? 1.25 : 1 }}
                    transition={{
                        type: 'spring',
                        visualDuration: selected ? 0.2 : 0.15,
                        bounce: selected ? 0.5 : 0.55,
                    }}
                >
                    <div
                        className={cn(
                            'flex h-full w-full items-center justify-center rounded-full bg-linear-to-t',
                            filled
                                ? 'from-transparent via-transparent to-neutral-50/20'
                                : 'from-transparent',
                        )}
                    >
                        <MakiGlyph
                            maki={maki}
                            color={filled ? iconFill : color}
                            className='h-4 w-4'
                        />
                    </div>
                </motion.div>
                {/* <div className='font-primary absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap text-center text-xs drop-shadow-md stroke-1 stroke-white'>
                    {label}
                </div> */}
            </div>
        </Marker>
    );
}

export const PlaceMarker = memo(PlaceMarkerComponent);
