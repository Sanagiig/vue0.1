import { noop, extend,tip,warn as baseWarn} from '@utils/index';
import { generateCodeFrame } from './codeframe';

type CompiledFunctionResult = {
  render: Function;
  staticRenderFns: Array<Function>;
};

function createFunction (code:string, errors:any) {
  try {
    return new Function(code)
  } catch (err) {
    errors.push({ err, code })
    return noop
  }
}

export function createCompileToFunctionFn (compile: Function): Function {
  const cache = Object.create(null);
  // 处理编译 tip ,err 
  // 生成 fn 并处理其间的 err
  // 缓存 template 对应的 renderFn
  return function compileToFunctions(
    template: string,
    options?: CompilerOptions,
    vm?: Component
  ): CompiledFunctionResult{
    // 删除 options.warn
    options = extend({},<CompilerOptions>options);
    const warn = options.warn || baseWarn;
    delete options.warn;
    
    // 检测是否可以使用 eval
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production') {
       // detect possible CSP restriction
       try {
        new Function('return 1')
      } catch (e) {
        if (e.toString().match(/unsafe-eval|CSP/)) {
          warn(
            'It seems you are using the standalone build of Vue.js in an ' +
            'environment with Content Security Policy that prohibits unsafe-eval. ' +
            'The template compiler cannot work in this environment. Consider ' +
            'relaxing the policy to allow unsafe-eval or pre-compiling your ' +
            'templates into render functions.'
          )
        }
      }
    }

    // 缓存 template 编译后的 render
    // check cache
    const key = options.delimiters
      ? String(options.delimiters) + template
      : template
    if (cache[key]) {
      return cache[key]
    }

    // compile
    const compiled:any = compile(template, options);

    // check compilation errors/tips
    // 打印编译时的 tip && error
    if (process.env.NODE_ENV !== 'production') {
      if (compiled.errors && compiled.errors.length) {
        if (options.outputSourceRange) {
          (<any[]>compiled.errors).forEach(e => {
            warn(
              `Error compiling template:\n\n${e.msg}\n\n` +
              generateCodeFrame(template, e.start, e.end),
              vm
            )
          })
        } else {
          warn(
            `Error compiling template:\n\n${template}\n\n` +
            (<any[]>compiled.errors).map(e => `- ${e}`).join('\n') + '\n',
            vm
          )
        }
      }
      if (compiled.tips && compiled.tips.length) {
        if (options.outputSourceRange) {
          (<any[]>compiled.tips).forEach(e => tip(e.msg, vm))
        } else {
          (<any[]>compiled.tips).forEach(msg => tip(msg, vm))
        }
      }
    }

    // turn code into functions
    // 编译后code 转 fn
    const res:any = {}
    const fnGenErrors:any[] = []
    res.render = createFunction(compiled.render, fnGenErrors)
    res.staticRenderFns = (<any[]>compiled.staticRenderFns).map(code => {
      return createFunction(code, fnGenErrors)
    })

    // check function generation errors.
    // this should only happen if there is a bug in the compiler itself.
    // mostly for codegen development use
    /* istanbul ignore if */
    // 打印生成 fn 的 error
    if (process.env.NODE_ENV !== 'production') {
      if ((!compiled.errors || !compiled.errors.length) && fnGenErrors.length) {
        warn(
          `Failed to generate render function:\n\n` +
          fnGenErrors.map(({ err, code }) => `${err.toString()} in\n\n${code}\n`).join('\n'),
          vm
        )
      }
    }

    return (cache[key] = res);
  }
}