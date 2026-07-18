import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import type {
  CreateTemplateInput,
  SaveDraftInput,
  TemplateBundle,
  TemplateVersion,
} from './types'

const keys = {
  list: ['templates'] as const,
  detail: (id: string) => ['templates', id] as const,
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

export function useTemplates() {
  return useQuery({
    queryKey: keys.list,
    queryFn: api.listTemplates,
  })
}

export function useTemplateBundle(id: string | undefined) {
  return useQuery({
    queryKey: keys.detail(id ?? 'unknown'),
    queryFn: () => api.getTemplateBundle(id!),
    enabled: Boolean(id),
  })
}

export function useCreateTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateTemplateInput) => api.createTemplate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: keys.list })
    },
  })
}

export function useSaveDraft(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: SaveDraftInput) => {
      const version = await api.saveDraft(id, input)
      // Prefer server value; if empty, keep what we just sent (images).
      const assetsJson =
        version.assetsJson && version.assetsJson.trim() !== '[]'
          ? version.assetsJson
          : (input.assetsJson ?? version.assetsJson ?? '[]')
      return { ...version, assetsJson }
    },
    onSuccess: async (version) => {
      // Update cache in place — avoid refetch wiping in-memory assets / dirty state.
      queryClient.setQueryData<TemplateBundle>(keys.detail(id), (current) =>
        mergeVersionIntoBundle(current, version, { status: 'draft' }),
      )
      await queryClient.invalidateQueries({ queryKey: keys.list })
    },
  })
}

export function usePublishTemplate(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.publishTemplate(id),
    onSuccess: async (version) => {
      queryClient.setQueryData<TemplateBundle>(keys.detail(id), (current) =>
        mergeVersionIntoBundle(current, version, {
          status: 'published',
          currentVersionNumber: version.versionNumber,
        }),
      )
      await queryClient.invalidateQueries({ queryKey: keys.list })
    },
  })
}
