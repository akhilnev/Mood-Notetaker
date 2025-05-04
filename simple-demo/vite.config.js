export default {
  root: './',
  build: {
    outDir: 'dist'
  },
  assetsInclude: ['**/*.bin', '**/models/**/*'],
  server: {
    fs: {
      // Allow serving files from one level up from the package root
      allow: ['..']
    }
  }
} 