import { useMemo } from 'react'
import { cn } from '@/lib/cn'
import { makiIconSvg } from '@/lib/makiIcon'

type MakiGlyphProps = {
	maki?: string
	color?: string
	className?: string
	title?: string
}

export function MakiGlyph({ maki, color = 'currentColor', className, title }: MakiGlyphProps) {
	const html = useMemo(() => {
		const raw = makiIconSvg(maki)
		return raw.replace(/<svg\b/, '<svg fill="currentColor"')
	}, [maki])

	return (
		<span
			aria-hidden={!title}
			title={title}
			className={cn(
				'inline-flex shrink-0 items-center justify-center [&_svg]:h-full [&_svg]:w-full',
				className,
			)}
			style={{ color }}
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	)
}
