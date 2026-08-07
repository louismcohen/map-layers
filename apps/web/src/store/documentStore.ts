import {
	createEmptyDocument,
	type Document,
	addPlaces as domainAddPlaces,
	createLayer as domainCreateLayer,
	deleteNodes as domainDeleteNodes,
	moveNodes as domainMoveNodes,
	renameNode as domainRenameNode,
	setLayerCollapsed as domainSetLayerCollapsed,
	setLayerColor as domainSetLayerColor,
	setLayerVisible as domainSetLayerVisible,
	ungroupLayer as domainUngroupLayer,
	type NodeId,
	type PlaceDraft,
} from '@map-layers/domain'
import { del, get, set } from 'idb-keyval'
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
	| { type: 'new-layer'; name: string }

export type Toast = {
	id: string
	message: string
}

type DocumentStore = {
	document: Document
	hydrated: boolean
	selectedNodeIds: NodeId[]
	selectedPlaceId: NodeId | null
	lastSkippedCount: number
	toasts: Toast[]
	setHydrated: (value: boolean) => void
	setSelectedNodeIds: (ids: NodeId[]) => void
	selectPlace: (id: NodeId | null) => void
	pushToast: (message: string) => void
	dismissToast: (id: string) => void
	createLayer: (name: string, parentId?: NodeId | null) => NodeId | null
	renameNode: (id: NodeId, name: string) => void
	toggleLayerVisible: (id: NodeId) => void
	setLayerColor: (id: NodeId, color: string) => void
	setLayerCollapsed: (id: NodeId, collapsed: boolean) => void
	ungroupLayer: (id: NodeId) => void
	deleteNodes: (ids: NodeId[]) => void
	moveNodes: (ids: NodeId[], targetParentId: NodeId | null, index: number) => void
	addPlaces: (places: PlaceDraft[], target: AddTarget) => NodeId[]
}

function toastId() {
	return `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

export const useDocumentStore = create<DocumentStore>()(
	persist(
		(setState, getState) => ({
			document: createEmptyDocument(),
			hydrated: false,
			selectedNodeIds: [],
			selectedPlaceId: null,
			lastSkippedCount: 0,
			toasts: [],
			setHydrated: (value) => setState({ hydrated: value }),
			setSelectedNodeIds: (ids) => setState({ selectedNodeIds: ids }),
			selectPlace: (id) =>
				setState({
					selectedPlaceId: id,
					selectedNodeIds: id ? [id] : getState().selectedNodeIds,
				}),
			pushToast: (message) =>
				setState((state) => ({
					toasts: [...state.toasts, { id: toastId(), message }],
				})),
			dismissToast: (id) =>
				setState((state) => ({
					toasts: state.toasts.filter((t) => t.id !== id),
				})),
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
			setLayerCollapsed: (id, collapsed) => {
				setState({ document: domainSetLayerCollapsed(getState().document, id, collapsed) })
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
					const created = domainCreateLayer(doc, { name: target.name || 'New layer' })
					doc = created.doc
					parentId = created.layerId
				}

				const result = domainAddPlaces(doc, {
					places,
					targetParentId: parentId,
				})

				setState({
					document: result.doc,
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
