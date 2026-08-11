import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type PromptModalProps = {
    open: boolean;
    title: string;
    label: string;
    initialValue?: string;
    confirmLabel?: string;
    onConfirm: (value: string) => void;
    onCancel: () => void;
};

export function PromptModal({
    open,
    title,
    label,
    initialValue = '',
    confirmLabel = 'Create',
    onConfirm,
    onCancel,
}: PromptModalProps) {
    const [value, setValue] = useState(initialValue);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            setValue(initialValue);
            queueMicrotask(() => inputRef.current?.focus());
        }
    }, [open, initialValue]);

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
                        if (!value.trim()) return;
                        onConfirm(value.trim());
                    }}
                    autoComplete='off'
                >
                    <DialogHeader className='mb-3'>
                        <DialogTitle>{title}</DialogTitle>
                    </DialogHeader>
                    <Label
                        className='mb-1 text-xs text-muted-foreground'
                        htmlFor='prompt-input'
                    >
                        {label}
                    </Label>
                    <Input
                        id='prompt-input'
                        name='layer-name'
                        autoComplete='off'
                        ref={inputRef}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className='mb-4'
                    />
                    <DialogFooter>
                        <Button
                            type='button'
                            variant='ghost'
                            onClick={onCancel}
                        >
                            Cancel
                        </Button>
                        <Button type='submit' disabled={!value.trim()}>
                            {confirmLabel}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

type ConfirmModalProps = {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
};

export function ConfirmModal({
    open,
    title,
    message,
    confirmLabel = 'Delete',
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
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
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{message}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button type='button' variant='ghost' onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        type='button'
                        variant='destructive'
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
