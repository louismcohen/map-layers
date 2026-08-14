import { createId, type Document } from '@map-layers/domain'
import { supabase } from '@/lib/supabase'
import { documentToRows, rowsToDocument, wouldWipeNonEmptyWorkspace } from './mapper'
import type { ExistingWorkspaceIds, WorkspaceRow } from './types'

export class EmptyWorkspaceWipeError extends Error {
	constructor() {
		super('Refusing to delete all rows of a non-empty workspace')
		this.name = 'EmptyWorkspaceWipeError'
	}
}

async function requireUserId(): Promise<string> {
	const { data, error } = await supabase.auth.getClaims()
	const userId = data?.claims?.sub
	if (error || !userId) throw new Error('Not signed in')
	return userId
}

function throwIfError(error: { message: string } | null): void {
	if (error) throw new Error(error.message)
}

/** Insert an empty workspace on first login; ON CONFLICT (user_id) DO NOTHING. */
export async function ensureWorkspace(): Promise<WorkspaceRow> {
	const userId = await requireUserId()
	const { error: upsertError } = await supabase
		.from('workspaces')
		.upsert(
			{ id: createId('wsp'), user_id: userId },
			{ onConflict: 'user_id', ignoreDuplicates: true },
		)
	throwIfError(upsertError)

	const { data, error } = await supabase
		.from('workspaces')
		.select('*')
		.eq('user_id', userId)
		.single()
	throwIfError(error)
	if (!data) throw new Error('Workspace not found')
	return data
}

export async function loadWorkspace(): Promise<{ document: Document; workspaceId: string }> {
	const workspace = await ensureWorkspace()

	const [layersRes, placesRes, isochronesRes, treeRes] = await Promise.all([
		supabase.from('layers').select('*').eq('workspace_id', workspace.id),
		supabase.from('places').select('*').eq('workspace_id', workspace.id),
		supabase.from('isochrones').select('*').eq('workspace_id', workspace.id),
		supabase
			.from('tree_nodes')
			.select('*')
			.eq('workspace_id', workspace.id)
			.order('parent_id')
			.order('sort_index'),
	])
	throwIfError(layersRes.error)
	throwIfError(placesRes.error)
	throwIfError(isochronesRes.error)
	throwIfError(treeRes.error)

	const document = rowsToDocument({
		workspace,
		layers: layersRes.data ?? [],
		places: placesRes.data ?? [],
		isochrones: isochronesRes.data ?? [],
		tree_nodes: treeRes.data ?? [],
	})
	return { document, workspaceId: workspace.id }
}

export async function saveWorkspace(doc: Document, workspaceId: string): Promise<void> {
	const incoming = documentToRows(doc, workspaceId)

	const [layersRes, placesRes, isochronesRes, treeRes] = await Promise.all([
		supabase.from('layers').select('id').eq('workspace_id', workspaceId),
		supabase.from('places').select('id').eq('workspace_id', workspaceId),
		supabase.from('isochrones').select('id').eq('workspace_id', workspaceId),
		supabase.from('tree_nodes').select('node_id').eq('workspace_id', workspaceId),
	])
	throwIfError(layersRes.error)
	throwIfError(placesRes.error)
	throwIfError(isochronesRes.error)
	throwIfError(treeRes.error)

	const existing: ExistingWorkspaceIds = {
		layerIds: (layersRes.data ?? []).map((row) => row.id),
		placeIds: (placesRes.data ?? []).map((row) => row.id),
		isochroneIds: (isochronesRes.data ?? []).map((row) => row.id),
		treeNodeIds: (treeRes.data ?? []).map((row) => row.node_id),
	}

	if (wouldWipeNonEmptyWorkspace(incoming, existing)) {
		throw new EmptyWorkspaceWipeError()
	}

	if (incoming.layers.length > 0) {
		const { error } = await supabase.from('layers').upsert(incoming.layers, { onConflict: 'id' })
		throwIfError(error)
	}
	if (incoming.places.length > 0) {
		const { error } = await supabase.from('places').upsert(incoming.places, { onConflict: 'id' })
		throwIfError(error)
	}
	if (incoming.isochrones.length > 0) {
		const { error } = await supabase
			.from('isochrones')
			.upsert(incoming.isochrones, { onConflict: 'id' })
		throwIfError(error)
	}
	if (incoming.tree_nodes.length > 0) {
		const { error } = await supabase
			.from('tree_nodes')
			.upsert(incoming.tree_nodes, { onConflict: 'workspace_id,node_id' })
		throwIfError(error)
	}

	const incomingLayerIds = new Set(incoming.layers.map((row) => row.id))
	const incomingPlaceIds = new Set(incoming.places.map((row) => row.id))
	const incomingIsochroneIds = new Set(incoming.isochrones.map((row) => row.id))
	const incomingTreeIds = new Set(incoming.tree_nodes.map((row) => row.node_id))

	await deleteMissing('isochrones', 'id', workspaceId, existing.isochroneIds, incomingIsochroneIds)
	await deleteMissing('places', 'id', workspaceId, existing.placeIds, incomingPlaceIds)
	await deleteMissing('layers', 'id', workspaceId, existing.layerIds, incomingLayerIds)
	await deleteMissing('tree_nodes', 'node_id', workspaceId, existing.treeNodeIds, incomingTreeIds)

	const { error: workspaceError } = await supabase
		.from('workspaces')
		.update({
			default_place_color: incoming.default_place_color,
			updated_at: new Date().toISOString(),
		})
		.eq('id', workspaceId)
	throwIfError(workspaceError)
}

async function deleteMissing(
	table: 'layers' | 'places' | 'isochrones' | 'tree_nodes',
	idColumn: 'id' | 'node_id',
	workspaceId: string,
	existingIds: string[],
	incomingIds: Set<string>,
): Promise<void> {
	const missing = existingIds.filter((id) => !incomingIds.has(id))
	if (missing.length === 0) return
	const { error } = await supabase
		.from(table)
		.delete()
		.eq('workspace_id', workspaceId)
		.in(idColumn, missing)
	throwIfError(error)
}
