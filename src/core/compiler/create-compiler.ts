import {extend} from '@utils/index';
import { detectErrors } from './error-detector';
import { createCompileToFunctionFn } from './to-function'

// 创建编译器 fac ， 存储 baseCompile
export function createCompilerCreator(baseCompile: Function): Function {
  // 创建编译器，存储baseOptions
  return function createCompiler(baseOptions: CompilerOptions) {
    // 编译器，确定提示工具，合成 modules && directives
    // 通过外部options 生成编译所需选项
    // 编译结果由baseCompile 决定，并且会加上提示 && 错误 信息
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
        if (options.modules) {
          finalOptions.modules =
            (baseOptions.modules || []).concat(options.modules)
        }
        // merge custom directives
        if (options.directives) {
          finalOptions.directives = extend(
            Object.create(baseOptions.directives || null),
            options.directives
          )
        }
        // copy other options
        for (const key in options) {
          if (key !== 'modules' && key !== 'directives') {
            finalOptions[key] = (<any>options)[key]
          }
        }
      }

      finalOptions.warn = warn;

      const compiled = baseCompile(template.trim(), finalOptions);
      if (process.env.NODE_ENV !== 'production') {
        detectErrors(compiled.ast, warn)
      }
      compiled.error = error;
      compiled.tips = tips;
      return compiled;
    }

    return {
      compile,
      compileToFunctions:createCompileToFunctionFn(compile)
    }
  }
}