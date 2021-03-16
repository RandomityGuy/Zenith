// !!!! MAKE SURE TO COPY ALL CHANGES FROM THIS FILE INTO rollup-fast.config.js!!!!

import typescript from 'rollup-plugin-typescript2';
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