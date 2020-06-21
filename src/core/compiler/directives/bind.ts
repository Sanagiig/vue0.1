/**
 * 更改 ast.wrapData
 * wrapData 接收 genDataCode , tag, v-bind="value" , modifiers.prop , modifiers.sync
 * 通过 bindObjectProps
 */
export default function bind(el: ASTElement, dir: ASTDirective) {
  el.wrapData = (code: string) => {
    return `_b(${code},'${el.tag}',${dir.value},${
      dir.modifiers && dir.modifiers.prop ? 'true' : 'false'
    }${
      dir.modifiers && dir.modifiers.sync ? ',true' : ''
    })`
  }
}
