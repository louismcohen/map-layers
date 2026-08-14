import { SignOutIcon } from '@phosphor-icons/react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

/** Compact email + logout for the sidebar footer. */
export function AccountMenu() {
    const { claims, signOut } = useAuth();
    const email = claims?.email ?? null;

    return (
        <div className='flex shrink-0 items-center gap-2 px-3 py-2'>
            <p
                className='min-w-0 flex-1 truncate text-xs text-muted-foreground'
                title={email ?? undefined}
            >
                {email ?? 'Signed in'}
            </p>
            <AlertDialog>
                <AlertDialogTrigger
                    render={
                        <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            className='shrink-0 gap-1.5 text-xs'
                        />
                    }
                >
                    <SignOutIcon className='size-3.5' weight='bold' />
                    Log Out
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Log Out</AlertDialogTitle>
                        <AlertDialogDescription>
                            You will need to sign in again to open your
                            workspace.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            variant='destructive'
                            onClick={() => void signOut()}
                        >
                            Log Out
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
