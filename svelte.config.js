import adapterCloudflare from '@sveltejs/adapter-cloudflare';
import adapterStatic from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// Detect build target from environment
const buildTarget = process.env.BUILD_TARGET;

function getAdapter() {
	switch (buildTarget) {
		case 'tauri':
		case 'capacitor':
			return adapterStatic({
				fallback: 'index.html'
			});
		default:
			return adapterCloudflare();
	}
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: getAdapter()
	}
};

export default config;
