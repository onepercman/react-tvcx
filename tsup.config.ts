import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['cjs', 'esm'],
  external: ['tailwindcss'],
  dts: true,
  sourcemap: true,
})
