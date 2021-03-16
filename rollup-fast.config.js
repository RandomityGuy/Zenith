// This file is a faster way to bundle the project, but will throw much less TypeScript errors. Good for repetetive iterative work, but not good for being 100% type-correct. It's for debug, basically.

import typescript from 'rollup-plugin-typescript';
import externals from 'rollup-plugin-node-externals';

export default [{
	input: './src/ts/index.ts',
    plugins: [
		externals(),
		typescript()
    ],
    output: {
        format: 'cjs',
        file: './src/bundle.js'
	},
	onwarn: function (message) {
		if (message.code === 'CIRCULAR_DEPENDENCY' || message.code === "MISSING_GLOBAL_NAME" || message.code === "UNRESOLVED_IMPORT") {
			return;
		}
		console.warn(message);
	}
}];