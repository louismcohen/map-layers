import type { Tables } from '@/lib/database.types'

export type WorkspaceRow = Tables<'workspaces'>
export type LayerRow = Tables<'layers'>
export type PlaceRow = Tables<'places'>
export type IsochroneRow = Tables<'isochrones'>
export type TreeNodeRow = Tables<'tree_nodes'>

export type WorkspaceChildRows = {
	layers: LayerRow[]
	places: PlaceRow[]
	isochrones: IsochroneRow[]
	tree_nodes: TreeNodeRow[]
}

export type DocumentRows = WorkspaceChildRows & {
	default_place_color: string
}

export type WorkspaceSnapshot = WorkspaceChildRows & {
	workspace: WorkspaceRow
}

export type ExistingWorkspaceIds = {
	layerIds: string[]
	placeIds: string[]
	isochroneIds: string[]
	treeNodeIds: string[]
}
