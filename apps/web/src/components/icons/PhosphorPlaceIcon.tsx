import type { IconWeight } from '@phosphor-icons/react'
import { iconForGoogleType, iconForPhosphorName } from '@/lib/googlePlaceIcon'
import { cn } from '@/lib/utils'

type PhosphorPlaceIconProps = {
	/** Phosphor catalog name (layer override). */
	name?: string
	/** Google `primaryType` when no catalog name is set. */
	featureType?: string
	color?: string
	className?: string
	weight?: IconWeight
}

export function PhosphorPlaceIcon({
	name,
	featureType,
	color = 'currentColor',
	className,
	weight = 'fill',
}: PhosphorPlaceIconProps) {
	const Icon = name ? iconForPhosphorName(name) : iconForGoogleType(featureType)
	return <Icon weight={weight} color={color} className={cn('h-4 w-4', className)} />
}
