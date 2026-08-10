import {
	createEmptyDocument,
	type Document,
	addIsochrone as domainAddIsochrone,
	addPlaces as domainAddPlaces,
	createLayer as domainCreateLayer,
	deleteNodes as domainDeleteNodes,
	moveNodes as domainMoveNodes,
	renameNode as domainRenameNode,
	setIsochroneColor as domainSetIsochroneColor,
	setIsochroneVisible as domainSetIsochroneVisible,
	setLayerCollapsed as domainSetLayerCollapsed,
	setLayerColor as domainSetLayerColor,
	setLayerMaki as domainSetLayerMaki,
	setLayerVisible as domainSetLayerVisible,
	ungroupLayer as domainUngroupLayer,
	type IsochroneDraft,
	type NodeId,
	type PlaceDraft,
} from '@map-layers/domain'
import { del, get, set } from 'idb-keyval'
import { toast } from 'sonner'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

const IDB_KEY = 'map-layers:v1'

const idbStorage = {
	getItem: async (name: string): Promise<string | null> => {
		const value = await get<string>(name)
		return value ?? null
	},
	setItem: async (name: string, value: string): Promise<void> => {
		await set(name, value)
	},
	removeItem: async (name: string): Promise<void> => {
		await del(name)
	},
}

export type AddTarget =
	| { type: 'root' }
	| { type: 'layer'; layerId: NodeId }
	| { type: 'new-layer'; name: string; color?: string }

export type SearchPreview = {
	color: string
	results: PlaceDraft[]
	selectedMapboxIds: string[]
}

type DocumentStore = {
	document: Document
	hydrated: boolean
	selectedNodeIds: NodeId[]
	selectedPlaceId: NodeId | null
	searchPreview: SearchPreview | null
	lastSkippedCount: number
	setHydrated: (value: boolean) => void
	setSelectedNodeIds: (ids: NodeId[]) => void
	selectPlace: (id: NodeId | null) => void
	setSearchPreview: (preview: SearchPreview | null) => void
	toggleSearchSelection: (mapboxId: string) => void
	setSearchSelection: (mapboxIds: string[]) => void
	pushToast: (message: string) => void
	createLayer: (name: string, parentId?: NodeId | null) => NodeId | null
	renameNode: (id: NodeId, name: string) => void
	toggleLayerVisible: (id: NodeId) => void
	setLayerColor: (id: NodeId, color: string) => void
	setLayerMaki: (id: NodeId, maki: string | undefined) => void
	setLayerCollapsed: (id: NodeId, collapsed: boolean) => void
	toggleIsochroneVisible: (id: NodeId) => void
	setIsochroneColor: (id: NodeId, color: string) => void
	ungroupLayer: (id: NodeId) => void
	deleteNodes: (ids: NodeId[]) => void
	moveNodes: (ids: NodeId[], targetParentId: NodeId | null, index: number) => void
	addPlaces: (places: PlaceDraft[], target: AddTarget) => NodeId[]
	addIsochrone: (draft: IsochroneDraft, targetParentId?: NodeId | null) => NodeId | null
}

export const useDocumentStore = create<DocumentStore>()(
	persist(
		(setState, getState) => ({
			document: createEmptyDocument(),
			hydrated: false,
			selectedNodeIds: [],
			selectedPlaceId: null,
			searchPreview: null,
			lastSkippedCount: 0,
			setHydrated: (value) => setState({ hydrated: value }),
			setSelectedNodeIds: (ids) => setState({ selectedNodeIds: ids }),
			selectPlace: (id) =>
				setState({
					selectedPlaceId: id,
					selectedNodeIds: id ? [id] : getState().selectedNodeIds,
				}),
			setSearchPreview: (preview) => setState({ searchPreview: preview }),
			toggleSearchSelection: (mapboxId) => {
				const preview = getState().searchPreview
				if (!preview) return
				const selected = new Set(preview.selectedMapboxIds)
				if (selected.has(mapboxId)) selected.delete(mapboxId)
				else selected.add(mapboxId)
				setState({
					searchPreview: { ...preview, selectedMapboxIds: [...selected] },
				})
			},
			setSearchSelection: (mapboxIds) => {
				const preview = getState().searchPreview
				if (!preview) return
				setState({
					searchPreview: { ...preview, selectedMapboxIds: mapboxIds },
				})
			},
			pushToast: (message) => {
				toast(message)
			},
			createLayer: (name, parentId = null) => {
				try {
					const { doc, layerId } = domainCreateLayer(getState().document, {
						name,
						parentId,
					})
					setState({ document: doc, selectedNodeIds: [layerId] })
					return layerId
				} catch (error) {
					getState().pushToast(error instanceof Error ? error.message : 'Could not create layer')
					return null
				}
			},
			renameNode: (id, name) => {
				try {
					setState({ document: domainRenameNode(getState().document, id, name) })
				} catch (error) {
					getState().pushToast(error instanceof Error ? error.message : 'Could not rename')
				}
			},
			toggleLayerVisible: (id) => {
				const layer = getState().document.nodes[id]
				if (layer?.kind !== 'layer') return
				setState({
					document: domainSetLayerVisible(getState().document, id, !layer.visible),
				})
			},
			setLayerColor: (id, color) => {
				setState({ document: domainSetLayerColor(getState().document, id, color) })
			},
			setLayerMaki: (id, maki) => {
				setState({ document: domainSetLayerMaki(getState().document, id, maki) })
			},
			setLayerCollapsed: (id, collapsed) => {
				setState({ document: domainSetLayerCollapsed(getState().document, id, collapsed) })
			},
			toggleIsochroneVisible: (id) => {
				const node = getState().document.nodes[id]
				if (node?.kind !== 'isochrone') return
				setState({
					document: domainSetIsochroneVisible(getState().document, id, !node.visible),
				})
			},
			setIsochroneColor: (id, color) => {
				setState({ document: domainSetIsochroneColor(getState().document, id, color) })
			},
			ungroupLayer: (id) => {
				try {
					setState({
						document: domainUngroupLayer(getState().document, id),
						selectedNodeIds: [],
					})
				} catch (error) {
					getState().pushToast(error instanceof Error ? error.message : 'Could not ungroup')
				}
			},
			deleteNodes: (ids) => {
				const selectedPlaceId = getState().selectedPlaceId
				setState({
					document: domainDeleteNodes(getState().document, ids),
					selectedNodeIds: [],
					selectedPlaceId:
						selectedPlaceId && ids.includes(selectedPlaceId) ? null : selectedPlaceId,
				})
			},
			moveNodes: (ids, targetParentId, index) => {
				try {
					setState({
						document: domainMoveNodes(getState().document, {
							ids,
							targetParentId,
							index,
						}),
					})
				} catch (error) {
					getState().pushToast(error instanceof Error ? error.message : 'Could not move')
				}
			},
			addPlaces: (places, target) => {
				let doc = getState().document
				let parentId: NodeId | null = null

				if (target.type === 'layer') {
					parentId = target.layerId
				} else if (target.type === 'new-layer') {
					const created = domainCreateLayer(doc, {
						name: target.name || 'New layer',
						color: target.color,
					})
					doc = created.doc
					parentId = created.layerId
				}

				const result = domainAddPlaces(doc, {
					places,
					targetParentId: parentId,
				})

				setState({
					document: result.doc,
					searchPreview: null,
					lastSkippedCount: result.skippedMapboxIds.length,
					selectedNodeIds: result.addedIds.length ? result.addedIds : parentId ? [parentId] : [],
				})

				if (result.skippedMapboxIds.length > 0) {
					getState().pushToast(
						`Skipped ${result.skippedMapboxIds.length} duplicate place${result.skippedMapboxIds.length === 1 ? '' : 's'}`,
					)
				}
				if (result.addedIds.length > 0) {
					getState().pushToast(
						`Added ${result.addedIds.length} place${result.addedIds.length === 1 ? '' : 's'}`,
					)
				}
				return result.addedIds
			},
			addIsochrone: (draft, targetParentId = null) => {
				try {
					const { doc, id } = domainAddIsochrone(getState().document, {
						draft,
						targetParentId,
					})
					setState({ document: doc, selectedNodeIds: [id], selectedPlaceId: null })
					getState().pushToast(`Added ${draft.name}`)
					return id
				} catch (error) {
					getState().pushToast(
						error instanceof Error ? error.message : 'Could not add isochrone',
					)
					return null
				}
			},
		}),
		{
			name: IDB_KEY,
			storage: createJSONStorage(() => idbStorage),
			partialize: (state) => ({ document: state.document }),
			onRehydrateStorage: () => (state) => {
				state?.setHydrated(true)
			},
		},
	),
)
