const isTauri = Boolean(import.meta.env.TAURI);

export const ssr = !isTauri;
export const prerender = isTauri;
