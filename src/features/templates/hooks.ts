import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import type { CreateTemplateInput, SaveDraftInput } from './types'

const keys = {
  list: ['templates'] as const,
  detail: (id: string) => ['templates', id] as const,
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
    mutationFn: (input: SaveDraftInput) => api.saveDraft(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: keys.detail(id) })
      await queryClient.invalidateQueries({ queryKey: keys.list })
    },
  })
}

export function usePublishTemplate(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.publishTemplate(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: keys.detail(id) })
      await queryClient.invalidateQueries({ queryKey: keys.list })
    },
  })
}
