<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { adapter, type PickedEpubFile } from '$lib/platform';
	import { bookStore } from '$lib/stores/bookStore';

	let { children } = $props();

	const WINDOW_STATE_KEY = 'kruthi:window-state';

	const openPickedFile = async (file: PickedEpubFile) => {
		const parsed = await bookStore.loadFromBytes(file.bytes, file.name);
		await goto(`/read?bookId=${parsed.id}`);
	};

	onMount(() => {
		void adapter.init();
		if (import.meta.env.PROD && 'serviceWorker' in navigator) {
			void navigator.serviceWorker.register('/sw.js');
		}

		const setupTauri = async () => {
			const isTauri = typeof window !== 'undefined' &&
				!!(window as unknown as { __TAURI__?: unknown }).__TAURI__;
			if (!isTauri) {
				return;
			}

			const [{ listen }, { Menu, MenuItem, PredefinedMenuItem, Submenu }, windowApi] = await Promise.all([
				import('@tauri-apps/api/event'),
				import('@tauri-apps/api/menu'),
				import('@tauri-apps/api/window')
			]);

			const appWindow = windowApi.getCurrentWindow();
			let windowStateTimer: ReturnType<typeof setTimeout> | null = null;

			const persistWindowState = (state: { width: number; height: number; x: number; y: number }) => {
				if (windowStateTimer) {
					clearTimeout(windowStateTimer);
				}
				windowStateTimer = setTimeout(() => {
					window.localStorage.setItem(WINDOW_STATE_KEY, JSON.stringify(state));
				}, 200);
			};

			const restoreWindowState = async () => {
				const raw = window.localStorage.getItem(WINDOW_STATE_KEY);
				if (!raw) {
					return;
				}
				try {
					const parsed = JSON.parse(raw) as { width: number; height: number; x: number; y: number };
					if (Number.isFinite(parsed.width) && Number.isFinite(parsed.height)) {
						await appWindow.setSize(new windowApi.LogicalSize(parsed.width, parsed.height));
					}
					if (Number.isFinite(parsed.x) && Number.isFinite(parsed.y)) {
						await appWindow.setPosition(new windowApi.LogicalPosition(parsed.x, parsed.y));
					}
				} catch {
					window.localStorage.removeItem(WINDOW_STATE_KEY);
				}
			};

			const openFromMenu = async () => {
				try {
					const picked = await adapter.pickEpubFile();
					if (picked) {
						await openPickedFile(picked);
					}
				} catch (error) {
					console.error('Failed to open book:', error);
				}
			};

			const openItem = await MenuItem.new({
				text: 'Open Book...',
				accelerator: 'CmdOrCtrl+O',
				action: () => void openFromMenu()
			});
			const separator = await PredefinedMenuItem.new({ item: 'Separator' });
			const quitItem = await PredefinedMenuItem.new({ item: 'Quit' });
			const fileMenu = await Submenu.new({
				text: 'File',
				items: [openItem, separator, quitItem]
			});

			const fullscreenItem = await MenuItem.new({
				text: 'Toggle Fullscreen',
				accelerator: 'F11',
				action: () => {
					void appWindow.isFullscreen().then((isFullscreen) => appWindow.setFullscreen(!isFullscreen));
				}
			});
			const viewMenu = await Submenu.new({
				text: 'View',
				items: [fullscreenItem]
			});

			const menu = await Menu.new({
				items: [fileMenu, viewMenu]
			});
			await menu.setAsAppMenu();

			await restoreWindowState();
			const unlistenResize = await appWindow.onResized(({ payload }) => {
				void appWindow.innerPosition().then((pos) => {
					persistWindowState({
						width: payload.width,
						height: payload.height,
						x: pos.x,
						y: pos.y
					});
				});
			});
			const unlistenMove = await appWindow.onMoved(({ payload }) => {
				void appWindow.innerSize().then((size) => {
					persistWindowState({
						width: size.width,
						height: size.height,
						x: payload.x,
						y: payload.y
					});
				});
			});

			const unlistenOpen = await listen<string>('open-file', async (event) => {
				const path = event.payload;
				if (!path || !path.toLowerCase().endsWith('.epub')) {
					return;
				}
				try {
					const picked = await adapter.readEpubFile(path);
					if (picked) {
						await openPickedFile(picked);
					}
				} catch (error) {
					console.error('Failed to open associated book:', error);
				}
			});

			return () => {
				unlistenResize();
				unlistenMove();
				unlistenOpen();
			};
		};

		let cleanup: (() => void) | undefined;
		void setupTauri().then((dispose) => {
			cleanup = dispose;
		});

		return () => {
			cleanup?.();
		};
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
