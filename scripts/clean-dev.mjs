import { rmSync } from 'node:fs'
import { join } from 'node:path'

const removeOptions = { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }

for (const dir of ['.next', join('node_modules', '.cache')]) {
  rmSync(join(process.cwd(), dir), removeOptions)
  console.log(`Removed ${dir}`)
}

console.log('Dev cache cleared. Run npm run dev next.')
