import { addProp } from '@utils/index';

// 为el.props.push({textContent:val.toString()})
export default function text (el: ASTElement, dir: ASTDirective) {
  if (dir.value) {
    addProp(el, 'textContent', `_s(${dir.value})`, dir)
  }
}
