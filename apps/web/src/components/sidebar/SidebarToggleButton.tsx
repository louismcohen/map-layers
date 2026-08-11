import { SidebarIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

type SidebarToggleButtonProps = {
	/** `header` sits opposite Search Places; `overlay` is the map reopen control. */
	variant: 'header' | 'overlay'
}

/** Phosphor `Sidebar` toggle — same control, chrome adapted per placement. */
export function SidebarToggleButton({ variant }: SidebarToggleButtonProps) {
	const { isMobile, state, toggleSidebar } = useSidebar()

	if (variant === 'overlay' && !isMobile && state !== 'collapsed') return null

	const show = variant === 'overlay'
	const label = show ? 'Show sidebar' : 'Hide sidebar'

	const button = (
		<Button
			type='button'
			variant='ghost'
			size='icon-sm'
			className={cn(
				variant === 'overlay'
					? 'border border-border bg-background/90 shadow-sm backdrop-blur'
					: 'shrink-0 text-muted-foreground hover:text-foreground',
			)}
			aria-label={label}
			title={label}
			onClick={toggleSidebar}
		>
			<SidebarIcon weight='duotone' className='size-4' />
		</Button>
	)

	if (variant === 'overlay') {
		return (
			<div className='pointer-events-auto absolute top-3 left-3 z-20'>
				{button}
			</div>
		)
	}

	return button
}
