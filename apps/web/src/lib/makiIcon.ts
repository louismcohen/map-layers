const iconModules = import.meta.glob('../../node_modules/@mapbox/maki/icons/*.svg', {
	eager: true,
	query: '?raw',
	import: 'default',
}) as Record<string, string>

function nameFromPath(path: string): string {
	const match = path.match(/\/([^/]+)\.svg$/)
	return match?.[1] ?? ''
}

const svgByName = new Map(
	Object.entries(iconModules).map(([path, svg]) => [nameFromPath(path), svg] as const),
)

function requireIconSvg(name: string): string {
	const svg = svgByName.get(name)
	if (!svg) throw new Error(`Missing @mapbox/maki ${name}.svg`)
	return svg
}

const markerSvg = requireIconSvg('marker')

/** Sorted Maki icon names available for pickers. */
export const MAKI_ICON_NAMES = [...svgByName.keys()].sort((a, b) => a.localeCompare(b))

/** Raw Maki SVG markup for a Mapbox Maki name; unknown → marker. */
export function makiIconSvg(maki?: string): string {
	if (maki) {
		const svg = svgByName.get(maki)
		if (svg) return svg
	}
	return markerSvg
}
