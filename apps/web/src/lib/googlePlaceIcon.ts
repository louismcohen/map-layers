import type { Document } from '@map-layers/domain'
import {
	AirplaneIcon,
	ArmchairIcon,
	BabyIcon,
	BankIcon,
	BarbellIcon,
	BarnIcon,
	BasketballIcon,
	BeachBallIcon,
	BedIcon,
	BeerSteinIcon,
	BicycleIcon,
	BinocularsIcon,
	BoatIcon,
	BookIcon,
	BookOpenIcon,
	BreadIcon,
	BridgeIcon,
	BriefcaseIcon,
	BroadcastIcon,
	BuildingsIcon,
	BusIcon,
	CarIcon,
	CatIcon,
	ChargingStationIcon,
	ChurchIcon,
	CircleIcon,
	ClubIcon,
	CoffeeIcon,
	CoinsIcon,
	ColumnsIcon,
	CookingPotIcon,
	CreditCardIcon,
	CrossIcon,
	DesktopIcon,
	DeviceMobileIcon,
	DiamondIcon,
	DogIcon,
	DropIcon,
	EnvelopeIcon,
	FactoryIcon,
	FilmReelIcon,
	FilmSlateIcon,
	FireIcon,
	FirstAidIcon,
	FishIcon,
	FlagCheckeredIcon,
	FlameIcon,
	FlowerIcon,
	FlowerLotusIcon,
	ForkKnifeIcon,
	GameControllerIcon,
	GarageIcon,
	GasPumpIcon,
	GiftIcon,
	GolfIcon,
	GraduationCapIcon,
	HammerIcon,
	HamburgerIcon,
	HorseIcon,
	HouseIcon,
	IceCreamIcon,
	type Icon,
	KeyIcon,
	MapPinIcon,
	MapTrifoldIcon,
	MaskHappyIcon,
	MicrophoneStageIcon,
	MountainsIcon,
	MusicNotesIcon,
	OrangeIcon,
	PackageIcon,
	PaletteIcon,
	PawPrintIcon,
	PersonSimpleHikeIcon,
	PersonSimpleSkiIcon,
	PillIcon,
	PinwheelIcon,
	PizzaIcon,
	PlanetIcon,
	PoliceCarIcon,
	ScalesIcon,
	ScissorsIcon,
	ShoppingCartIcon,
	SnowflakeIcon,
	SoccerBallIcon,
	StorefrontIcon,
	StudentIcon,
	SubwayIcon,
	SuitcaseIcon,
	SwimmingPoolIcon,
	TShirtIcon,
	TaxiIcon,
	TennisBallIcon,
	TentIcon,
	ToiletIcon,
	TrainIcon,
	TreeEvergreenIcon,
	TreeIcon,
	TruckIcon,
	UsersThreeIcon,
	VanIcon,
	WarehouseIcon,
	WavesIcon,
	WineIcon,
	WrenchIcon,
} from '@phosphor-icons/react'

const ICON_BY_TYPE: Record<string, Icon> = {}

function assign(icon: Icon, ...types: string[]) {
	for (const type of types) ICON_BY_TYPE[type] = icon
}

assign(CarIcon, 'car_dealer', 'car_rental', 'auto_parts_store')
assign(TruckIcon, 'truck_dealer', 'truck_stop')
assign(WrenchIcon, 'car_repair', 'tire_shop', 'plumber', 'electrician', 'painter', 'roofing_contractor')
assign(DropIcon, 'car_wash', 'fountain')
assign(GasPumpIcon, 'gas_station')
assign(ChargingStationIcon, 'electric_vehicle_charging_station')
assign(BicycleIcon, 'ebike_charging_station', 'bicycle_store', 'bike_sharing_station')
assign(GarageIcon, 'parking', 'parking_garage', 'parking_lot')
assign(ToiletIcon, 'rest_stop', 'public_bath', 'public_bathroom')

assign(BuildingsIcon, 'corporate_office', 'business_center', 'coworking_space', 'city_hall', 'government_office', 'local_government_office', 'embassy', 'apartment_building', 'apartment_complex', 'condominium_complex', 'housing_complex')
assign(FactoryIcon, 'manufacturer')
assign(BarnIcon, 'farm', 'ranch')
assign(WarehouseIcon, 'supplier')
assign(BroadcastIcon, 'television_studio')

assign(PaletteIcon, 'art_gallery', 'art_studio', 'sculpture')
assign(BankIcon, 'art_museum', 'history_museum', 'museum', 'bank', 'accounting')
assign(MaskHappyIcon, 'auditorium', 'performing_arts_theater')
assign(ColumnsIcon, 'castle', 'monument', 'cultural_landmark', 'historical_place')

assign(BookOpenIcon, 'library')
assign(GraduationCapIcon, 'preschool', 'primary_school', 'secondary_school', 'school', 'educational_institution')
assign(StudentIcon, 'university', 'academic_department', 'research_institute')

assign(PinwheelIcon, 'amusement_park', 'amusement_center', 'ferris_wheel', 'roller_coaster', 'water_park')
assign(FishIcon, 'aquarium', 'fishing_charter', 'fishing_pier', 'fishing_pond')
assign(CatIcon, 'zoo', 'wildlife_park', 'wildlife_refuge')
assign(FilmSlateIcon, 'movie_theater')
assign(FilmReelIcon, 'movie_rental')
assign(ClubIcon, 'casino')
assign(CircleIcon, 'bowling_alley')
assign(MusicNotesIcon, 'night_club', 'karaoke', 'comedy_club', 'dance_hall', 'live_music_venue')
assign(MicrophoneStageIcon, 'concert_hall', 'opera_house', 'philharmonic_hall', 'amphitheatre')
assign(TreeIcon, 'park', 'city_park', 'state_park', 'national_park', 'garden', 'botanical_garden', 'plaza', 'picnic_ground')
assign(DogIcon, 'dog_park')
assign(PersonSimpleHikeIcon, 'hiking_area', 'cycling_park', 'off_roading_area')
assign(BoatIcon, 'marina', 'ferry_terminal', 'ferry_service')
assign(WineIcon, 'vineyard', 'bar', 'bar_and_grill', 'cocktail_bar', 'wine_bar', 'lounge_bar', 'hookah_bar', 'winery', 'liquor_store', 'tea_store')
assign(BinocularsIcon, 'tourist_attraction', 'observation_deck', 'visitor_center', 'historical_landmark')
assign(PlanetIcon, 'planetarium')
assign(GameControllerIcon, 'video_arcade', 'go_karting_venue', 'paintball_center', 'indoor_playground', 'skateboard_park', 'miniature_golf_course', 'toy_store')
assign(UsersThreeIcon, 'community_center', 'cultural_center', 'convention_center', 'event_venue', 'banquet_hall', 'wedding_venue')
assign(PersonSimpleSkiIcon, 'adventure_sports_center', 'ski_resort')
assign(TentIcon, 'childrens_camp', 'campground', 'rv_park', 'mobile_home_park')
assign(DesktopIcon, 'internet_cafe')
assign(FlameIcon, 'barbecue_area')

assign(HorseIcon, 'stable')
assign(CreditCardIcon, 'atm')

assign(CoffeeIcon, 'cafe', 'cat_cafe', 'dog_cafe', 'coffee_shop', 'coffee_stand', 'coffee_roastery', 'tea_house')
assign(BreadIcon, 'bakery', 'bagel_shop', 'cake_shop', 'pastry_shop')
assign(OrangeIcon, 'juice_shop')
assign(
	IceCreamIcon,
	'donut_shop',
	'candy_store',
	'confectionery',
	'chocolate_shop',
	'chocolate_factory',
	'ice_cream_shop',
	'dessert_shop',
	'dessert_restaurant',
	'acai_shop',
)
assign(BeerSteinIcon, 'brewery', 'beer_garden', 'pub', 'gastropub', 'brewpub', 'irish_pub')
assign(SoccerBallIcon, 'sports_bar')
assign(HamburgerIcon, 'hamburger_restaurant', 'sandwich_shop', 'deli')
assign(PizzaIcon, 'pizza_restaurant', 'pizza_delivery')
assign(
	ForkKnifeIcon,
	'restaurant',
	'diner',
	'bistro',
	'cafeteria',
	'food_court',
	'meal_delivery',
	'meal_takeaway',
	'snack_bar',
	'salad_shop',
	'soup_restaurant',
	'noodle_shop',
	'taco_restaurant',
	'burrito_restaurant',
	'mexican_restaurant',
	'tex_mex_restaurant',
)

assign(MapTrifoldIcon, 'country', 'locality', 'administrative_area_level_1', 'administrative_area_level_2', 'postal_code', 'school_district')

assign(ScalesIcon, 'courthouse', 'lawyer')
assign(PoliceCarIcon, 'police', 'neighborhood_police_station')
assign(FireIcon, 'fire_station')
assign(EnvelopeIcon, 'post_office')

assign(
	FirstAidIcon,
	'hospital',
	'general_hospital',
	'medical_center',
	'medical_clinic',
	'medical_lab',
	'doctor',
	'chiropractor',
	'dental_clinic',
	'dentist',
	'physiotherapist',
)
assign(PillIcon, 'pharmacy', 'drugstore')
assign(
	FlowerLotusIcon,
	'spa',
	'massage',
	'massage_spa',
	'sauna',
	'tanning_studio',
	'skin_care_clinic',
	'wellness_center',
	'yoga_studio',
)

assign(
	BedIcon,
	'hotel',
	'extended_stay_hotel',
	'resort_hotel',
	'motel',
	'inn',
	'hostel',
	'lodging',
	'bed_and_breakfast',
	'guest_house',
	'private_guest_room',
	'farmstay',
	'cottage',
	'camping_cabin',
	'japanese_inn',
	'budget_japanese_inn',
)

assign(BeachBallIcon, 'beach')
assign(MountainsIcon, 'island', 'scenic_spot', 'mountain_peak')
assign(WavesIcon, 'lake', 'river')
assign(TreeEvergreenIcon, 'woods', 'nature_preserve')

assign(ChurchIcon, 'church', 'hindu_temple', 'buddhist_temple', 'mosque', 'synagogue', 'shinto_shrine')

assign(ScissorsIcon, 'barber_shop', 'hair_care', 'hair_salon', 'beauty_salon', 'beautician', 'nail_salon', 'makeup_artist', 'body_art_service')
assign(KeyIcon, 'locksmith')
assign(TShirtIcon, 'laundry', 'clothing_store', 'womens_clothing_store', 'shoe_store', 'sportswear_store')
assign(FlowerIcon, 'florist')
assign(CrossIcon, 'funeral_home', 'cemetery')
assign(PawPrintIcon, 'veterinary_care', 'pet_care', 'pet_boarding_service', 'pet_store')
assign(HouseIcon, 'real_estate_agency')
assign(PackageIcon, 'storage', 'moving_company', 'courier_service', 'shipping_service')
assign(BabyIcon, 'child_care_agency')
assign(SuitcaseIcon, 'travel_agency', 'tour_agency', 'tourist_information_center')
assign(CookingPotIcon, 'catering_service', 'food_delivery')
assign(
	BriefcaseIcon,
	'insurance_agency',
	'consultant',
	'marketing_consultant',
	'employment_agency',
	'association_or_organization',
	'non_profit_organization',
	'astrologer',
	'psychic',
	'tailor',
	'telecommunications_service_provider',
	'chauffeur_service',
	'aircraft_rental_service',
	'summer_camp_organizer',
	'foot_care',
	'service',
)

assign(
	ShoppingCartIcon,
	'supermarket',
	'grocery_store',
	'asian_grocery_store',
	'discount_supermarket',
	'hypermarket',
	'food_store',
	'health_food_store',
	'farmers_market',
	'butcher_shop',
)
assign(
	StorefrontIcon,
	'convenience_store',
	'discount_store',
	'department_store',
	'shopping_mall',
	'store',
	'market',
	'flea_market',
	'warehouse_store',
	'wholesaler',
	'general_store',
	'thrift_store',
)
assign(BookIcon, 'book_store')
assign(DeviceMobileIcon, 'cell_phone_store', 'electronics_store')
assign(DiamondIcon, 'jewelry_store')
assign(ArmchairIcon, 'furniture_store', 'home_goods_store')
assign(HammerIcon, 'home_improvement_store', 'hardware_store', 'building_materials_store', 'garden_center')
assign(BasketballIcon, 'sporting_goods_store', 'playground')
assign(GiftIcon, 'gift_shop', 'cosmetics_store')

assign(
	BarbellIcon,
	'gym',
	'fitness_center',
	'sports_club',
	'sports_complex',
	'sports_activity_location',
	'sports_coaching',
	'sports_school',
	'athletic_field',
	'arena',
	'stadium',
)
assign(GolfIcon, 'golf_course', 'indoor_golf_course')
assign(SwimmingPoolIcon, 'swimming_pool')
assign(TennisBallIcon, 'tennis_court')
assign(SnowflakeIcon, 'ice_skating_rink')
assign(FlagCheckeredIcon, 'race_course')

assign(AirplaneIcon, 'airport', 'international_airport', 'airstrip', 'heliport')
assign(TrainIcon, 'train_station', 'train_ticket_office')
assign(SubwayIcon, 'subway_station', 'light_rail_station', 'tram_stop')
assign(BusIcon, 'bus_station', 'bus_stop')
assign(TaxiIcon, 'taxi_stand', 'taxi_service')
assign(VanIcon, 'transit_station', 'transit_stop', 'transit_depot', 'transportation_service', 'park_and_ride')
assign(BridgeIcon, 'bridge')
assign(CoinsIcon, 'toll_station')

const SUFFIX_FALLBACKS: Array<readonly [string, Icon]> = [
	['_restaurant', ForkKnifeIcon],
	['_cafe', CoffeeIcon],
	['_bar', WineIcon],
	['_pub', WineIcon],
	['_museum', BankIcon],
	['_park', TreeIcon],
	['_station', VanIcon],
	['_school', GraduationCapIcon],
	['_hotel', BedIcon],
	['_inn', BedIcon],
	['_motel', BedIcon],
	['_shop', StorefrontIcon],
	['_store', StorefrontIcon],
]

/** Resolve a Phosphor icon for a Google Places `primaryType`. */
export function iconForGoogleType(type?: string): Icon {
	if (!type) return MapPinIcon
	const exact = ICON_BY_TYPE[type]
	if (exact) return exact
	for (const [suffix, icon] of SUFFIX_FALLBACKS) {
		if (type.endsWith(suffix)) return icon
	}
	return MapPinIcon
}

/** Catalog names stored on layers (`maki` field, legacy name). */
export const PLACE_ICONS = {
	Airplane: AirplaneIcon,
	Armchair: ArmchairIcon,
	Baby: BabyIcon,
	Bank: BankIcon,
	Barbell: BarbellIcon,
	Barn: BarnIcon,
	Basketball: BasketballIcon,
	BeachBall: BeachBallIcon,
	Bed: BedIcon,
	BeerStein: BeerSteinIcon,
	Bicycle: BicycleIcon,
	Binoculars: BinocularsIcon,
	Boat: BoatIcon,
	Book: BookIcon,
	BookOpen: BookOpenIcon,
	Bread: BreadIcon,
	Bridge: BridgeIcon,
	Briefcase: BriefcaseIcon,
	Broadcast: BroadcastIcon,
	Buildings: BuildingsIcon,
	Bus: BusIcon,
	Car: CarIcon,
	Cat: CatIcon,
	ChargingStation: ChargingStationIcon,
	Church: ChurchIcon,
	Circle: CircleIcon,
	Club: ClubIcon,
	Coffee: CoffeeIcon,
	Coins: CoinsIcon,
	Columns: ColumnsIcon,
	CookingPot: CookingPotIcon,
	CreditCard: CreditCardIcon,
	Cross: CrossIcon,
	Desktop: DesktopIcon,
	DeviceMobile: DeviceMobileIcon,
	Diamond: DiamondIcon,
	Dog: DogIcon,
	Drop: DropIcon,
	Envelope: EnvelopeIcon,
	Factory: FactoryIcon,
	FilmReel: FilmReelIcon,
	FilmSlate: FilmSlateIcon,
	Fire: FireIcon,
	FirstAid: FirstAidIcon,
	Fish: FishIcon,
	Flame: FlameIcon,
	Flower: FlowerIcon,
	FlowerLotus: FlowerLotusIcon,
	ForkKnife: ForkKnifeIcon,
	GameController: GameControllerIcon,
	Garage: GarageIcon,
	GasPump: GasPumpIcon,
	Gift: GiftIcon,
	Golf: GolfIcon,
	GraduationCap: GraduationCapIcon,
	Hammer: HammerIcon,
	Hamburger: HamburgerIcon,
	Horse: HorseIcon,
	House: HouseIcon,
	IceCream: IceCreamIcon,
	Key: KeyIcon,
	MapPin: MapPinIcon,
	MapTrifold: MapTrifoldIcon,
	MaskHappy: MaskHappyIcon,
	MicrophoneStage: MicrophoneStageIcon,
	Mountains: MountainsIcon,
	MusicNotes: MusicNotesIcon,
	Orange: OrangeIcon,
	Package: PackageIcon,
	Palette: PaletteIcon,
	PawPrint: PawPrintIcon,
	PersonSimpleHike: PersonSimpleHikeIcon,
	PersonSimpleSki: PersonSimpleSkiIcon,
	Pill: PillIcon,
	Pinwheel: PinwheelIcon,
	Pizza: PizzaIcon,
	Planet: PlanetIcon,
	PoliceCar: PoliceCarIcon,
	Scales: ScalesIcon,
	Scissors: ScissorsIcon,
	ShoppingCart: ShoppingCartIcon,
	Snowflake: SnowflakeIcon,
	SoccerBall: SoccerBallIcon,
	Storefront: StorefrontIcon,
	Student: StudentIcon,
	Subway: SubwayIcon,
	Suitcase: SuitcaseIcon,
	SwimmingPool: SwimmingPoolIcon,
	TShirt: TShirtIcon,
	Taxi: TaxiIcon,
	TennisBall: TennisBallIcon,
	Tent: TentIcon,
	Toilet: ToiletIcon,
	Train: TrainIcon,
	Tree: TreeIcon,
	TreeEvergreen: TreeEvergreenIcon,
	Truck: TruckIcon,
	UsersThree: UsersThreeIcon,
	Van: VanIcon,
	Warehouse: WarehouseIcon,
	Waves: WavesIcon,
	Wine: WineIcon,
	Wrench: WrenchIcon,
} as const

export type PlaceIconName = keyof typeof PLACE_ICONS

export const PLACE_ICON_NAMES = (Object.keys(PLACE_ICONS) as PlaceIconName[]).sort((a, b) =>
	a.localeCompare(b),
)

export function isPlaceIconName(name: string): name is PlaceIconName {
	return Object.hasOwn(PLACE_ICONS, name)
}

export function iconForPhosphorName(name?: string): Icon {
	if (name && isPlaceIconName(name)) return PLACE_ICONS[name]
	return MapPinIcon
}

/** Mapbox Maki kebab names → Phosphor catalog names (layer persist migration). */
const MAKI_TO_PHOSPHOR: Record<string, PlaceIconName> = {
	aerialway: 'PersonSimpleSki',
	airfield: 'Airplane',
	airport: 'Airplane',
	'alcohol-shop': 'Wine',
	'american-football': 'Barbell',
	'amusement-park': 'Pinwheel',
	'animal-shelter': 'PawPrint',
	aquarium: 'Fish',
	'art-gallery': 'Palette',
	attraction: 'Binoculars',
	bakery: 'Bread',
	'bank-JP': 'Bank',
	bank: 'Bank',
	bar: 'Wine',
	baseball: 'Barbell',
	basketball: 'Basketball',
	bbq: 'Flame',
	beach: 'BeachBall',
	beer: 'BeerStein',
	'bicycle-share': 'Bicycle',
	bicycle: 'Bicycle',
	'blood-bank': 'FirstAid',
	'bowling-alley': 'Circle',
	bridge: 'Bridge',
	'building-alt1': 'Buildings',
	building: 'Buildings',
	bus: 'Bus',
	cafe: 'Coffee',
	campsite: 'Tent',
	'car-rental': 'Car',
	'car-repair': 'Wrench',
	car: 'Car',
	casino: 'Club',
	'castle-JP': 'Columns',
	castle: 'Columns',
	'cemetery-JP': 'Cross',
	cemetery: 'Cross',
	'charging-station': 'ChargingStation',
	cinema: 'FilmSlate',
	circle: 'Circle',
	city: 'Buildings',
	'clothing-store': 'TShirt',
	'college-JP': 'Student',
	college: 'Student',
	commercial: 'Storefront',
	confectionery: 'IceCream',
	convenience: 'Storefront',
	dentist: 'FirstAid',
	diamond: 'Diamond',
	doctor: 'FirstAid',
	'dog-park': 'Dog',
	embassy: 'Buildings',
	farm: 'Barn',
	'fast-food': 'Hamburger',
	ferry: 'Boat',
	'ferry-JP': 'Boat',
	'fire-station': 'Fire',
	'fire-station-JP': 'Fire',
	'fitness-centre': 'Barbell',
	florist: 'Flower',
	fuel: 'GasPump',
	furniture: 'Armchair',
	gaming: 'GameController',
	'garden-centre': 'Flower',
	garden: 'Tree',
	gift: 'Gift',
	golf: 'Golf',
	grocery: 'ShoppingCart',
	hairdresser: 'Scissors',
	harbor: 'Boat',
	hardware: 'Hammer',
	heliport: 'Airplane',
	'highway-rest-area': 'Toilet',
	historic: 'Columns',
	home: 'House',
	'horse-riding': 'Horse',
	'hospital-JP': 'FirstAid',
	hospital: 'FirstAid',
	'hot-spring': 'FlowerLotus',
	'ice-cream': 'IceCream',
	industry: 'Factory',
	information: 'Binoculars',
	'jewelry-store': 'Diamond',
	karaoke: 'MusicNotes',
	'landmark-JP': 'Columns',
	landmark: 'Columns',
	laundry: 'TShirt',
	library: 'BookOpen',
	'lighthouse-JP': 'Binoculars',
	lighthouse: 'Binoculars',
	lodging: 'Bed',
	'marker-stroked': 'MapPin',
	marker: 'MapPin',
	'mobile-phone': 'DeviceMobile',
	'monument-JP': 'Columns',
	monument: 'Columns',
	mountain: 'Mountains',
	museum: 'Bank',
	music: 'MusicNotes',
	natural: 'TreeEvergreen',
	nightclub: 'MusicNotes',
	'observation-tower': 'Binoculars',
	park: 'Tree',
	'park-alt1': 'Tree',
	'parking-garage': 'Garage',
	'parking-paid': 'Garage',
	parking: 'Garage',
	pharmacy: 'Pill',
	'picnic-site': 'Tree',
	pitch: 'Barbell',
	'place-of-worship': 'Church',
	playground: 'Basketball',
	'police-JP': 'PoliceCar',
	police: 'PoliceCar',
	'post-JP': 'Envelope',
	post: 'Envelope',
	racetrack: 'FlagCheckered',
	'rail-light': 'Subway',
	'rail-metro': 'Subway',
	rail: 'Train',
	'religious-buddhist': 'Church',
	'religious-christian': 'Church',
	'religious-jewish': 'Church',
	'religious-muslim': 'Church',
	'religious-shinto': 'Church',
	'restaurant-bbq': 'Flame',
	'restaurant-noodle': 'ForkKnife',
	'restaurant-pizza': 'Pizza',
	'restaurant-seafood': 'Fish',
	'restaurant-sushi': 'ForkKnife',
	restaurant: 'ForkKnife',
	'school-JP': 'GraduationCap',
	school: 'GraduationCap',
	shoe: 'TShirt',
	shop: 'Storefront',
	skateboard: 'GameController',
	skiing: 'PersonSimpleSki',
	soccer: 'SoccerBall',
	stadium: 'Barbell',
	suitcase: 'Suitcase',
	swimming: 'SwimmingPool',
	taxi: 'Taxi',
	teahouse: 'Coffee',
	tennis: 'TennisBall',
	theatre: 'MaskHappy',
	toilet: 'Toilet',
	toll: 'Coins',
	'town-hall': 'Buildings',
	town: 'Buildings',
}

export function makiNameToPhosphor(maki: string): PlaceIconName {
	return MAKI_TO_PHOSPHOR[maki] ?? 'MapPin'
}

/** Normalize a persisted layer `maki` to a Phosphor catalog name. */
export function resolveStoredLayerIcon(stored: string): PlaceIconName {
	if (isPlaceIconName(stored)) return stored
	return makiNameToPhosphor(stored)
}

/** Rewrite layer `maki` values from Maki names to Phosphor catalog names. */
export function migrateDocumentLayerIcons(doc: Document): Document {
	let changed = false
	const nodes = { ...doc.nodes }
	for (const [id, node] of Object.entries(nodes)) {
		if (node.kind !== 'layer' || !node.maki) continue
		const next = resolveStoredLayerIcon(node.maki)
		if (next === node.maki) continue
		changed = true
		nodes[id] = { ...node, maki: next }
	}
	return changed ? { ...doc, nodes } : doc
}
