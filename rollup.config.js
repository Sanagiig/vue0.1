import json from 'rollup-plugin-json';
import ts from 'rollup-plugin-typescript2';

export default {
    input: 'src/main.js',
    output: {
        file: 'bundle.js',
        format: 'cjs'
    },
    plugins: [json()],
    banner: '/* my-library version ' + 1 + ' */',
    footer: '/* follow me on Twitter! @rich_harris */'
};