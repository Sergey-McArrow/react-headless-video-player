import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2019',
  external: ['react', 'react-dom'],
  minify: false,
  banner: {
    js: "'use client';",
  },
  onSuccess: 'cp src/styles.css dist/styles.css',
})
