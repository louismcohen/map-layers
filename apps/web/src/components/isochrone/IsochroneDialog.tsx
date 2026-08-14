import {
    ISOCHRONE_MAX_MILES,
    ISOCHRONE_MAX_MINUTES,
    type IsochroneMetric,
    type IsochroneProfile,
    milesToMeters,
} from '@map-layers/domain';
import {
    CarProfileIcon,
    ClockIcon,
    type Icon,
    PathIcon,
    PersonSimpleBikeIcon,
    PersonSimpleWalkIcon,
} from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type IsochroneDialogCenter = {
    lng: number;
    lat: number;
    /** Optional label shown in the dialog subtitle */
    label?: string;
};

export type IsochroneDialogResult = {
    profile: IsochroneProfile;
    metric: IsochroneMetric;
    /** API units: minutes or meters (single contour). */
    contours: number[];
};

type IsochroneDialogProps = {
    open: boolean;
    center: IsochroneDialogCenter | null;
    submitting?: boolean;
    onCancel: () => void;
    onConfirm: (result: IsochroneDialogResult) => void;
};

const DEFAULT_MINUTES = 15;
const DEFAULT_MILES = 10;

const TAB_TRIGGER_CLASS =
    'gap-1 px-2 py-2 text-sm hover:text-[color-mix(in_oklch,var(--primary)_75%,var(--foreground))] data-active:text-primary data-active:hover:text-primary';

type TabOption<T extends string> = {
    value: T;
    label: string;
    icon: Icon;
};

const PROFILES: TabOption<IsochroneProfile>[] = [
    { value: 'walking', label: 'Walk', icon: PersonSimpleWalkIcon },
    { value: 'cycling', label: 'Bike', icon: PersonSimpleBikeIcon },
    { value: 'driving', label: 'Drive', icon: CarProfileIcon },
];

const METRICS: TabOption<IsochroneMetric>[] = [
    { value: 'time', label: 'Time', icon: ClockIcon },
    { value: 'distance', label: 'Distance', icon: PathIcon },
];

const AMOUNT_BY_METRIC = {
    time: {
        label: 'Travel Time',
        defaultValue: DEFAULT_MINUTES,
        min: 1,
        max: ISOCHRONE_MAX_MINUTES,
        step: 1,
        hint: `Up to ${ISOCHRONE_MAX_MINUTES} minutes`,
        integer: true,
        unit: 'min',
    },
    distance: {
        label: 'Travel Distance',
        defaultValue: DEFAULT_MILES,
        min: 0.1,
        max: ISOCHRONE_MAX_MILES,
        step: 0.1,
        hint: `Up to ${ISOCHRONE_MAX_MILES} miles`,
        integer: false,
        unit: 'mi',
    },
} as const;

function formatAmount(value: number, integer: boolean): string {
    if (integer) return String(Math.round(value));
    return String(Math.round(value * 10) / 10);
}

function OptionTabs<T extends string>({
    label,
    value,
    options,
    onValueChange,
}: {
    label: string;
    value: T;
    options: readonly TabOption<T>[];
    onValueChange: (value: T) => void;
}) {
    return (
        <div className='flex flex-col gap-1'>
            <Label className='text-xs text-muted-foreground'>{label}</Label>
            <Tabs
                value={value}
                onValueChange={(next) => {
                    if (options.some((option) => option.value === next)) {
                        onValueChange(next as T);
                    }
                }}
            >
                <TabsList className='w-full'>
                    {options.map(
                        ({
                            value: optionValue,
                            label: optionLabel,
                            icon: Icon,
                        }) => (
                            <TabsTrigger
                                key={optionValue}
                                value={optionValue}
                                className={TAB_TRIGGER_CLASS}
                            >
                                <Icon
                                    className='size-4'
                                    weight='duotone'
                                    aria-hidden
                                />
                                {optionLabel}
                            </TabsTrigger>
                        ),
                    )}
                </TabsList>
            </Tabs>
        </div>
    );
}

export function IsochroneDialog({
    open,
    center,
    submitting = false,
    onCancel,
    onConfirm,
}: IsochroneDialogProps) {
    const [profile, setProfile] = useState<IsochroneProfile>('walking');
    const [metric, setMetric] = useState<IsochroneMetric>('time');
    const [amount, setAmount] = useState(String(DEFAULT_MINUTES));

    const amountConfig = AMOUNT_BY_METRIC[metric];

    useEffect(() => {
        if (open) {
            setProfile('walking');
            setMetric('time');
            setAmount(String(DEFAULT_MINUTES));
        }
    }, [open]);

    const parsed = Number(amount);
    const amountValid =
        Number.isFinite(parsed) &&
        parsed > 0 &&
        parsed <= amountConfig.max &&
        (!amountConfig.integer || Number.isInteger(parsed));
    const sliderValue = Number.isFinite(parsed)
        ? Math.min(amountConfig.max, Math.max(amountConfig.min, parsed))
        : amountConfig.defaultValue;

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) onCancel();
            }}
        >
            <DialogContent
                showCloseButton={false}
                className='gap-4 sm:max-w-sm'
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (submitting || !amountValid) return;
                        const contours =
                            metric === 'time'
                                ? [parsed]
                                : [milesToMeters(parsed)];
                        onConfirm({ profile, metric, contours });
                    }}
                >
                    <DialogHeader className='mb-3'>
                        <DialogTitle>Add Isochrone</DialogTitle>
                        {center?.label ? (
                            <p className='truncate text-xs text-muted-foreground'>
                                {center.label}
                            </p>
                        ) : null}
                    </DialogHeader>

                    <div className='flex flex-col gap-2'>
                        <OptionTabs
                            label='Mode'
                            value={profile}
                            options={PROFILES}
                            onValueChange={setProfile}
                        />
                        <OptionTabs
                            label='Metric'
                            value={metric}
                            options={METRICS}
                            onValueChange={(next) => {
                                setMetric(next);
                                setAmount(
                                    String(AMOUNT_BY_METRIC[next].defaultValue),
                                );
                            }}
                        />

                        <div className='flex flex-col gap-1'>
                            <Label
                                className='text-xs text-muted-foreground'
                                htmlFor='iso-amount'
                            >
                                {amountConfig.label}
                            </Label>
                            <div className='flex items-center gap-3'>
                                <div className='relative w-22 shrink-0'>
                                    <Input
                                        id='iso-amount'
                                        type='number'
                                        inputMode='decimal'
                                        min={amountConfig.min}
                                        max={amountConfig.max}
                                        step={amountConfig.step}
                                        value={amount}
                                        onChange={(e) =>
                                            setAmount(e.target.value)
                                        }
                                        className='pr-10 tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
                                    />
                                    <span className='pointer-events-none absolute inset-0 flex items-baseline justify-end py-1 pr-3'>
                                        <span
                                            className='invisible w-0 overflow-hidden text-base'
                                            aria-hidden
                                        >
                                            0
                                        </span>
                                        <span className='text-xs text-muted-foreground'>
                                            {amountConfig.unit}
                                        </span>
                                    </span>
                                </div>
                                <Slider
                                    aria-label={amountConfig.label}
                                    className='min-w-0 flex-1'
                                    disabled={submitting}
                                    min={amountConfig.min}
                                    max={amountConfig.max}
                                    step={amountConfig.step}
                                    value={[sliderValue]}
                                    onValueChange={(values) => {
                                        const next = Array.isArray(values)
                                            ? values[0]
                                            : values;
                                        if (
                                            typeof next !== 'number' ||
                                            !Number.isFinite(next)
                                        ) {
                                            return;
                                        }
                                        setAmount(
                                            formatAmount(
                                                next,
                                                amountConfig.integer,
                                            ),
                                        );
                                    }}
                                />
                            </div>
                            <p className='text-[11px] text-muted-foreground'>
                                {amountConfig.hint}
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type='button'
                            variant='ghost'
                            onClick={onCancel}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type='submit'
                            disabled={submitting || !center || !amountValid}
                        >
                            {submitting ? 'Creating…' : 'Create'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
