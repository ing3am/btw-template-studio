import { createDefaultFacturaBlocks } from '../src/features/visual-builder/types.ts'
import { collectPresentTagIds } from '../src/features/visual-builder/dianPresence.ts'
import { requiredDianLabels } from '../src/features/visual-builder/dianLabels.ts'

const present = collectPresentTagIds(createDefaultFacturaBlocks())
const required = requiredDianLabels()
const missing = required.filter((l) => !present.has(l.id))
const extraOk = required.length - missing.length

console.log(`Present: ${extraOk}/${required.length}`)
if (missing.length) {
  console.log('MISSING:')
  for (const m of missing) console.log(`  - ${m.id}  (${m.path})`)
  process.exit(1)
}
console.log('All required DIAN labels present in default template.')
