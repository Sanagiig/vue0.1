import { addProp } from '@utils/index'

// v-html=val 将为 el.props.push({innerHTML:val.toString()})
export default function html (el: ASTElement, dir: ASTDirective) {
  if (dir.value) {
    addProp(el, 'innerHTML', `_s(${dir.value})`, dir)
  }
}
