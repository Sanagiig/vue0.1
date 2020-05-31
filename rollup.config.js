import path from 'path';
import json from 'rollup-plugin-json';
import typescript from 'rollup-plugin-typescript2';
import tsCompiler from 'typescript';
import resolve from 'rollup-plugin-node-resolve'
import cjs from 'rollup-plugin-commonjs'
import alias from 'rollup-plugin-alias';
import replace from 'rollup-plugin-replace';
const target = 'full';

let baseIO;

switch (target) {
    case 'full': {
        baseIO = {
            input: 'src/platform/entry/with-compiler.ts',
            output: {
                sourcemap: true,
                file: 'test/full/dist.js',
                name: 'Vvue',
                format: 'umd',
            },
        }
        break;
    }
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
        break;
    case 'compiler':
        baseIO = {

        }
}
export default {
    ...baseIO,
    plugins: [
        resolve(),
        cjs(),
        replace({
            'process.env.NODE_ENV': process.env.NODE_ENV,
            // 'he':"'./entity-decoder'"
        }),
        alias({
            he: './entity-decoder'
        }),
        typescript({
            typescript: tsCompiler,
            tsconfig: path.resolve(__dirname, 'tsconfig.json')
        }),
    ],
};