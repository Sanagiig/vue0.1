import path from 'path';
import json from 'rollup-plugin-json';
import typescript from 'rollup-plugin-typescript2';
import tsCompiler from 'typescript';
import replace from 'rollup-plugin-replace';
const target = 'ob';

let baseIO;

switch (target) {
    case 'ob':
        baseIO = {
            input: 'test/observer/index.ts',
            output: {
                sourcemap: true,
                file: 'test/observer/dist.js',
                name: 'observer',
                format: 'iife'
            }
        };
}
export default {
    ...baseIO,
    plugins: [
        json(),
        replace({
            'process.env.NODE_ENV': process.env.NODE_ENV
        }),
        typescript({
            typescript: tsCompiler,
            tsconfig: path.resolve(__dirname, 'tsconfig.json')
        })
    ],
};