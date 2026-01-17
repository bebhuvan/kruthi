import { spawn } from 'node:child_process';

const [mode, target, config] = process.argv.slice(2);

if (!mode || !target || !config) {
	console.error('Usage: node scripts/run-vite.mjs <dev|build> <target> <config>');
	process.exit(1);
}

const env = {
	...process.env,
	BUILD_TARGET: target
};

const args = [mode, '--config', config];
const child = spawn('vite', args, { stdio: 'inherit', env, shell: true });

child.on('exit', (code) => {
	process.exit(code ?? 1);
});
