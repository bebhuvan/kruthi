import type { PlatformAdapter } from '$lib/platform/types';
import { WebAdapter } from '$lib/platform/web';

// Will be swapped at build time for other platforms
export const adapter: PlatformAdapter = new WebAdapter();

export * from '$lib/platform/types';
