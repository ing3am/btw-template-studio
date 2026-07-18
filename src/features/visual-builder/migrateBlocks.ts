import type { TemplateBlock } from './types'

/**
 * Normalize legacy blocks: imagen+asQr → qr; default imagen sourceMode.
 */
export function migrateTemplateBlocks(blocks: TemplateBlock[]): TemplateBlock[] {
  return blocks.map((block) => {
    if (block.type === 'contenedor' && block.children?.length) {
      return {
        ...block,
        children: migrateTemplateBlocks(block.children),
      }
    }

    if (
      block.type === 'imagen' &&
      (Boolean(block.props.asQr) || String(block.props.tagId || '') === 'qr')
    ) {
      const { asQr: _asQr, ...rest } = block.props
      return {
        ...block,
        type: 'qr' as const,
        props: {
          ...rest,
          sourceMode: 'dian',
          srcPath: String(rest.srcPath || 'documento.qrUrl'),
          tagId: 'qr',
          width: Number(rest.width) || 80,
          height: Number(rest.height) || 80,
          align: String(rest.align || 'centro'),
        },
      }
    }

    if (block.type === 'imagen') {
      const hasAsset = Boolean(String(block.props.assetId || '').trim())
      const hasPath = Boolean(String(block.props.srcPath || '').trim())
      const sourceMode = String(block.props.sourceMode || '').trim()
      return {
        ...block,
        props: {
          ...block.props,
          sourceMode:
            sourceMode === 'upload' || sourceMode === 'campo'
              ? sourceMode
              : hasAsset
                ? 'upload'
                : hasPath
                  ? 'campo'
                  : 'upload',
          width: Number(block.props.width) || 120,
          height: Number(block.props.height) || 120,
        },
      }
    }

    return block
  })
}
