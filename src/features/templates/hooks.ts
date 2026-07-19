import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import type {
  CreateTemplateInput,
  SaveDraftInput,
  TemplateBundle,
  TemplateVersion,
} from './types'

const keys = {
  list: (nit: string) => ['templates', nit] as const,
  detail: (id: string, nit: string) => ['templates', nit, id] as const,
}

function mergeVersionIntoBundle(
  bundle: TemplateBundle | undefined,
  version: TemplateVersion,
  templatePatch?: Partial<TemplateBundle['template']>,
): TemplateBundle | undefined {
  if (!bundle) return bundle
  const versions = [
    version,
    ...bundle.versions.filter((item) => item.id !== version.id),
  ]
  return {
    template: {
      ...bundle.template,
      ...templatePatch,
      updatedAt: version.createdAt,
    },
    versions,
  }
}

export function useTemplates(nit: string | undefined) {
  const scopedNit = nit?.trim() ?? ''
  return useQuery({
    queryKey: keys.list(scopedNit),
    queryFn: () => api.listTemplates(scopedNit),
    enabled: Boolean(scopedNit),
  })
}

export function useTemplateBundle(id: string | undefined, nit: string | undefined) {
  const scopedNit = nit?.trim() ?? ''
  return useQuery({
    queryKey: keys.detail(id ?? 'unknown', scopedNit),
    queryFn: () => api.getTemplateBundle(id!, scopedNit),
    enabled: Boolean(id) && Boolean(scopedNit),
  })
}

export function useCreateTemplate(nit: string | undefined) {
  const queryClient = useQueryClient()
  const scopedNit = nit?.trim() ?? ''
  return useMutation({
    mutationFn: (input: CreateTemplateInput) => api.createTemplate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: keys.list(scopedNit) })
    },
  })
}

export function useSaveDraft(id: string, nit: string | undefined) {
  const queryClient = useQueryClient()
  const scopedNit = nit?.trim() ?? ''
  return useMutation({
    mutationFn: async (input: SaveDraftInput) => {
      const version = await api.saveDraft(id, input, scopedNit)
      // Prefer server value; if empty, keep what we just sent (images).
      const assetsJson =
        version.assetsJson && version.assetsJson.trim() !== '[]'
          ? version.assetsJson
          : (input.assetsJson ?? version.assetsJson ?? '[]')
      return { ...version, assetsJson }
    },
    onSuccess: async (version) => {
      // Update cache in place — avoid refetch wiping in-memory assets / dirty state.
      queryClient.setQueryData<TemplateBundle>(keys.detail(id, scopedNit), (current) => {
        const merged = mergeVersionIntoBundle(current, { ...version, status: 'draft', isPublished: false }, {
          hasDraft: true,
          currentVersionNumber: version.versionNumber,
        })
        if (!merged) return merged
        const published =
          merged.template.publishedVersionNumber ??
          merged.versions.find((v) => v.status === 'published' || v.isPublished)?.versionNumber ??
          0
        return {
          ...merged,
          template: {
            ...merged.template,
            // Keep "published" at template level if a live published version exists.
            status: published > 0 ? 'published' : 'draft',
            publishedVersionNumber: published,
            hasDraft: true,
          },
        }
      })
      await queryClient.invalidateQueries({ queryKey: keys.list(scopedNit) })
    },
  })
}

export function usePublishTemplate(id: string, nit: string | undefined) {
  const queryClient = useQueryClient()
  const scopedNit = nit?.trim() ?? ''
  return useMutation({
    mutationFn: () => api.saveDraft(id, { status: 'published' }, scopedNit),
    onSuccess: async (version) => {
      queryClient.setQueryData<TemplateBundle>(keys.detail(id, scopedNit), (current) => {
        if (!current) return current
        const versions = current.versions.map((item) => {
          if (item.id === version.id) {
            return { ...version, status: 'published' as const, isPublished: true }
          }
          if (item.isPublished || item.status === 'published') {
            return { ...item, isPublished: false, status: 'used' as const }
          }
          return item
        })
        const tip = versions.find((v) => v.id === version.id) ?? version
        const hasTip = versions.some((v) => v.id === version.id)
        const nextVersions = hasTip ? versions : [version, ...versions]
        return {
          template: {
            ...current.template,
            status: 'published',
            currentVersionNumber: tip.versionNumber,
            publishedVersionNumber: tip.versionNumber,
            hasDraft: false,
            updatedAt: version.createdAt,
          },
          versions: nextVersions,
        }
      })
      await queryClient.invalidateQueries({ queryKey: keys.list(scopedNit) })
    },
  })
}

export function useDeleteDraft(id: string, nit: string | undefined) {
  const queryClient = useQueryClient()
  const scopedNit = nit?.trim() ?? ''
  return useMutation({
    mutationFn: () => api.deleteDraft(id, scopedNit),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: keys.detail(id, scopedNit) })
      await queryClient.invalidateQueries({ queryKey: keys.list(scopedNit) })
    },
  })
}

export function useRollbackVersion(id: string, nit: string | undefined) {
  const queryClient = useQueryClient()
  const scopedNit = nit?.trim() ?? ''
  return useMutation({
    mutationFn: (versionNumber: number) => api.rollbackVersion(id, versionNumber, scopedNit),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: keys.detail(id, scopedNit) })
      await queryClient.invalidateQueries({ queryKey: keys.list(scopedNit) })
    },
  })
}
