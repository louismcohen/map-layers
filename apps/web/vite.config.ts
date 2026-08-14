import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			'@': path.resolve(dirname, 'src'),
		},
	},
	server: {
		host: true,
		port: 5173,
		allowedHosts: ['map-layersweb-production.up.railway.app', 'ambit.louiscohen.me'],
	},
})
