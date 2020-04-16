import {extend} from '@utils/index';
import { detectErrors } from './error-detector';
import { createCompileToFunctionFn } from './to-function'

export function createCompilerCreator (baseCompile: Function): Function {
  return function createCompiler (baseOptions: CompilerOptions) {
    function compile(
      template:string,
      options?:CompilerOptions
    ):CompiledResult{
      const finalOptions = Object.create(baseOptions);
      const error:any[] = [];
      const tips:any[] = [];

      let warn = ((msg:string,range:any,tip:any) =>{
        (tip ? tips:error).push(msg);
      });
      
      if(options){
        if (process.env.NODE_ENV !== 'production' && options.outputSourceRange) {
          // $flow-disable-line
          const leadingSpaceLength = (<any>template.match(/^\s*/))[0].length;

          warn = (msg,range:SERange,tip) =>{
            const data:WarningMessage = {msg};
            if(range){
              if(range.start != null){
                data.start = range.start + leadingSpaceLength;
              }
              if (range.end != null) {
                data.end = range.end + leadingSpaceLength
              }
            }
            (tip ? tips : error).push(data);
          }
        }

        // merge custom modules
        if(options.modules){
          
        }
      }
    }
  }
}