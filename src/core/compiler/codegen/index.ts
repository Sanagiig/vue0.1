
export type CodegenResult = {
  render: string,
  staticRenderFns: Array<string>
};


export function generate (
  ast: ASTElement | void,
  options: CompilerOptions
): CodegenResult {

}