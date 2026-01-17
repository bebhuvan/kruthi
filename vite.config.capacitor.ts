import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		alias: {
			'$lib/platform': fileURLToPath(new URL('./src/lib/platform/capacitor.ts', import.meta.url))
		}
	},
	define: {
		'import.meta.env.CAPACITOR': true
	}
});
