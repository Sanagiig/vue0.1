import { baseOptions } from './options';
import {createCompiler} from '@core/compiler/index';

const { compile, compileToFunctions } = createCompiler(baseOptions);
export { compile,compileToFunctions };
