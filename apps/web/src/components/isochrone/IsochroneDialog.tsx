import {
    ISOCHRONE_MAX_MILES,
    ISOCHRONE_MAX_MINUTES,
    type IsochroneMetric,
    type IsochroneProfile,
    milesToMeters,
} from '@map-layers/domain';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

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
const DEFAULT_MILES = 1;

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
        (metric === 'time'
            ? Number.isInteger(parsed) && parsed <= ISOCHRONE_MAX_MINUTES
            : parsed <= ISOCHRONE_MAX_MILES);

    const amountHint =
        metric === 'time'
            ? `Up to ${ISOCHRONE_MAX_MINUTES} minutes`
            : `Up to ${ISOCHRONE_MAX_MILES} miles`;

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
                        <DialogTitle>Add isochrone</DialogTitle>
                        {center?.label ? (
                            <p className='truncate text-xs text-muted-foreground'>
                                {center.label}
                            </p>
                        ) : null}
                    </DialogHeader>

                    <div className='mb-3 space-y-2'>
                        <Label
                            className='text-xs text-muted-foreground'
                            htmlFor='iso-profile'
                        >
                            Mode
                        </Label>
                        <Select
                            value={profile}
                            onValueChange={(value) => {
                                if (
                                    value === 'walking' ||
                                    value === 'cycling' ||
                                    value === 'driving'
                                ) {
                                    setProfile(value);
                                }
                            }}
                        >
                            <SelectTrigger
                                id='iso-profile'
                                className='w-full'
                                size='sm'
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='walking'>Walking</SelectItem>
                                <SelectItem value='cycling'>Cycling</SelectItem>
                                <SelectItem value='driving'>Driving</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className='mb-3 space-y-2'>
                        <Label
                            className='text-xs text-muted-foreground'
                            htmlFor='iso-metric'
                        >
                            Metric
                        </Label>
                        <Select
                            value={metric}
                            onValueChange={(value) => {
                                if (value === 'time' || value === 'distance') {
                                    setMetric(value);
                                    setAmount(
                                        value === 'time'
                                            ? String(DEFAULT_MINUTES)
                                            : String(DEFAULT_MILES),
                                    );
                                }
                            }}
                        >
                            <SelectTrigger
                                id='iso-metric'
                                className='w-full'
                                size='sm'
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='time'>
                                    Travel time
                                </SelectItem>
                                <SelectItem value='distance'>
                                    Distance
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className='mb-4 space-y-2'>
                        <Label
                            className='text-xs text-muted-foreground'
                            htmlFor='iso-amount'
                        >
                            {metric === 'time' ? 'Minutes' : 'Miles'}
                        </Label>
                        <Input
                            id='iso-amount'
                            type='number'
                            inputMode='decimal'
                            min={metric === 'time' ? 1 : 0.1}
                            max={
                                metric === 'time'
                                    ? ISOCHRONE_MAX_MINUTES
                                    : ISOCHRONE_MAX_MILES
                            }
                            step={metric === 'time' ? 1 : 0.1}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className='h-8'
                        />
                        <p className='text-[11px] text-muted-foreground'>
                            {amountHint}
                        </p>
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
