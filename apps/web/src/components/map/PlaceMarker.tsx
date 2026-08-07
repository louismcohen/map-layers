import { motion } from 'motion/react'
import { memo } from 'react'
import { Marker } from 'react-map-gl'
import { LocationIcon } from '@/components/icons/LocationIcon'

type PlaceMarkerProps = {
	id: string
	latitude: number
	longitude: number
	color: string
	selected: boolean
	onClick: (id: string) => void
}

function PlaceMarkerComponent({
	id,
	latitude,
	longitude,
	color,
	selected,
	onClick,
}: PlaceMarkerProps) {
	return (
		<Marker
			latitude={latitude}
			longitude={longitude}
			onClick={(e) => {
				e.originalEvent.stopPropagation()
				onClick(id)
			}}
			style={{ zIndex: selected ? 2 : 1 }}
		>
			<div
				className="pop-in"
				style={{
					['--delay-time' as string]: `${Math.random() * 0.25}s`,
				}}
			>
				<motion.div
					className="flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border backdrop-blur-md"
					style={{
						background: `linear-gradient(to top, rgb(229 229 229 / 0.95), rgb(250 250 250 / 0.95))`,
						borderColor: color,
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
					<LocationIcon fill={color} width={16} height={16} />
				</motion.div>
			</div>
		</Marker>
	)
}

export const PlaceMarker = memo(PlaceMarkerComponent)
