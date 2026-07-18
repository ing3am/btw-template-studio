import type { Collision, CollisionDetection } from '@dnd-kit/core'
import {
  closestCenter,
  pointerWithin,
  rectIntersection,
} from '@dnd-kit/core'
import type { DianLabel } from './dianLabels'
import {
  isChildAllowedInContainer,
  type BlockType,
  type TemplateBlock,
} from './types'

export type DropHintKind = 'field' | 'container' | 'root' | 'sibling'

export type DropHint = {
  kind: DropHintKind
  overId: string
  message: string
}

type LocateFn = (
  id: string,
) => { block: TemplateBlock; parentId: string | null } | null

function droppablePriority(id: string): number {
  if (id === 'root-drop') return 0
  if (id.startsWith('container:')) return 1
  return 2
}

/**
 * Prefer leaf targets over container zones, and container over root.
 * Also drop the contenedor header id when its `container:` zone is hit —
 * otherwise drops land as siblings outside the row.
 */
export function preferSpecificCollisions(hits: Collision[]): Collision[] {
  const ids = new Set(hits.map((hit) => String(hit.id)))
  const filtered = hits.filter((hit) => {
    const id = String(hit.id)
    if (ids.has(`container:${id}`)) return false
    return true
  })
  return [...filtered].sort(
    (a, b) =>
      droppablePriority(String(b.id)) - droppablePriority(String(a.id)),
  )
}

export const builderCollisionDetection: CollisionDetection = (args) => {
  const activeId = String(args.active.id)
  if (activeId.startsWith('label:') || activeId.startsWith('palette:')) {
    const pointerHits = pointerWithin(args)
    if (pointerHits.length > 0) return preferSpecificCollisions(pointerHits)
    const rectHits = rectIntersection(args)
    if (rectHits.length > 0) return preferSpecificCollisions(rectHits)
    return []
  }
  return closestCenter(args)
}

/**
 * Map drop on a contenedor header row → its inner cell zone when the
 * dragged type can live inside a container.
 */
export function normalizeContainerOverId(
  overId: string,
  type: BlockType,
  locate: LocateFn,
): string {
  if (overId.startsWith('container:') || overId === 'root-drop') return overId
  const located = locate(overId)
  if (
    located &&
    !located.parentId &&
    located.block.type === 'contenedor' &&
    isChildAllowedInContainer(type)
  ) {
    return `container:${overId}`
  }
  return overId
}

export function resolveDropHint(
  overId: string | null | undefined,
  options: {
    activeLabel: DianLabel | null
    activeType: BlockType | null
    locate: LocateFn
  },
): DropHint | null {
  if (!overId) return null
  const { activeLabel, activeType, locate } = options
  if (!activeLabel && !activeType) return null

  const insertType: BlockType =
    activeType ??
    (activeLabel?.kind === 'image' || activeLabel?.id === 'qr'
      ? 'qr'
      : 'datos')

  const resolvedOverId = normalizeContainerOverId(overId, insertType, locate)

  if (resolvedOverId === 'root-drop') {
    return {
      kind: 'root',
      overId: resolvedOverId,
      message: 'Nuevo bloque del documento',
    }
  }

  if (resolvedOverId.startsWith('container:')) {
    return {
      kind: 'container',
      overId: resolvedOverId,
      message: 'Nueva celda en el contenedor',
    }
  }

  const located = locate(resolvedOverId)
  if (!located) return null

  if (
    activeLabel &&
    activeLabel.kind === 'field' &&
    located.block.type === 'datos'
  ) {
    return {
      kind: 'field',
      overId: resolvedOverId,
      message: 'Agregar campo a este bloque Datos',
    }
  }

  if (located.parentId) {
    return {
      kind: 'sibling',
      overId: resolvedOverId,
      message: 'Insertar como celda junto a este bloque',
    }
  }

  return {
    kind: 'sibling',
    overId: resolvedOverId,
    message: 'Insertar bloque después de este',
  }
}
