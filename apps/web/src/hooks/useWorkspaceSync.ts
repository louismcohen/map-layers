import type { Document } from '@map-layers/domain'
import { useEffect, useRef } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { supabase } from '@/lib/supabase'
import { EmptyWorkspaceWipeError, loadWorkspace, saveWorkspace } from '@/lib/workspace'
import { useDocumentStore } from '@/store/documentStore'

const SAVE_DEBOUNCE_MS = 800

/**
 * Hydrate the working copy on sign-in; debounce document upserts.
 * Logout cancels a pending save and must not write.
 */
export function useWorkspaceSync() {
	const document = useDocumentStore((s) => s.document)
	const workspaceId = useDocumentStore((s) => s.workspaceId)
	const hydrated = useDocumentStore((s) => s.hydrated)
	const hydrateDocument = useDocumentStore((s) => s.hydrateDocument)
	const resetLocal = useDocumentStore((s) => s.resetLocal)
	const pushToast = useDocumentStore((s) => s.pushToast)

	const allowSaveRef = useRef(false)
	const skipNextSaveRef = useRef(false)
	const loadGenRef = useRef(0)

	const flushSave = useDebouncedCallback(async (doc: Document, wsId: string) => {
		if (!allowSaveRef.current) return
		try {
			await saveWorkspace(doc, wsId)
		} catch (error) {
			if (!allowSaveRef.current) return
			if (error instanceof EmptyWorkspaceWipeError) {
				console.warn('[ambit] Refusing to persist an empty tree over existing workspace rows')
				return
			}
			const message = error instanceof Error ? error.message : 'Could not save workspace'
			pushToast(message)
		}
	}, SAVE_DEBOUNCE_MS)

	useEffect(() => {
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event, session) => {
			if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') return

			if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session)) {
				loadGenRef.current += 1
				allowSaveRef.current = false
				flushSave.cancel()
				resetLocal()
				return
			}

			if (event !== 'INITIAL_SESSION' && event !== 'SIGNED_IN' && event !== 'PASSWORD_RECOVERY')
				return
			if (!session) return

			const gen = ++loadGenRef.current
			allowSaveRef.current = false
			flushSave.cancel()

			queueMicrotask(() => {
				void (async () => {
					try {
						const loaded = await loadWorkspace()
						if (gen !== loadGenRef.current) return
						skipNextSaveRef.current = true
						hydrateDocument({
							document: loaded.document,
							workspaceId: loaded.workspaceId,
						})
						allowSaveRef.current = true
					} catch (error) {
						if (gen !== loadGenRef.current) return
						const message = error instanceof Error ? error.message : 'Could not load workspace'
						pushToast(message)
					}
				})()
			})
		})

		return () => {
			subscription.unsubscribe()
			allowSaveRef.current = false
			flushSave.cancel()
		}
	}, [flushSave, hydrateDocument, pushToast, resetLocal])

	useEffect(() => {
		if (!hydrated || !workspaceId || !allowSaveRef.current) return
		if (skipNextSaveRef.current) {
			skipNextSaveRef.current = false
			return
		}
		void flushSave(document, workspaceId)
	}, [document, workspaceId, hydrated, flushSave])
}
