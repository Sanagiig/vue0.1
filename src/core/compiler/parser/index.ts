import he from 'he';
import { parseHTML } from './html-parser';
import { parseText } from './text-parser';
import { parseFilters } from './filter-parser';
import { baseWarn, pluckModuleFunction } from '../helpers';
import { isReservedTag } from '../../../utils/assert';
import {
  extend,
  cached,
  no,
  camelize,
  hyphenate,
  hasOwn,isIE, isEdge, isServerRendering
} from '@utils/index';

export const onRE = /^@|^v-on:/;
export const dirRE = /^v-|^@|^:|^\./;
export const forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/;
export const forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/;
const stripParensRE = /^\(|\)$/g;
const argRE = /:(.*)$/;
export const bindRE = /^:|^\.|^v-bind:/;
const propBindRE = /^\./;
const modifierRE = /\.[^.]+/g;
const lineBreakRE = /[\r\n]/;
const whitespaceRE = /\s+/g;
const decodeHTMLCached = cached(he.decode);

// configurable state
export let warn: any
let delimiters:any
let transforms:any
let preTransforms:any
let postTransforms:any
let platformIsPreTag:any
let platformMustUseProp:any
let platformGetTagNamespace:any
let maybeComponent: any

export function createASTElement (
  tag: string,
  attrs: Array<ASTAttr>,
  parent: ASTElement | void
): ASTElement {
  return {
    type: 1,
    tag,
    attrsList: attrs,
    attrsMap: makeAttrsMap(attrs),
    rawAttrsMap: {},
    parent,
    children: []
  }
}

/**
 * Convert HTML string to AST.
 */
export function parse ( 
  template: string,
  options: CompilerOptions
): ASTElement | void {
  warn = options.warn || baseWarn;
  platformIsPreTag = options.isPreTag || no;
  platformMustUseProp = options.mustUseProp || no;
  platformGetTagNamespace = options.getTagNamespace || no;
  const isReservedTag = options.isReservedTag || no;
  maybeComponent = (el: ASTElement) => !!el.component || !isReservedTag(el.tag);

  transforms = pluckModuleFunction(options.modules, 'transformNode');
  preTransforms = pluckModuleFunction(options.modules, 'preTransformNode');
  postTransforms = pluckModuleFunction(options.modules, 'postTransformNode');

  delimiters = options.delimiters;

  const stack: any[] = [];
  const preserveWhitespace = options.preserveWhitespace !== false;
  const whitespaceOption = options.whitespace;
  let root:any;
  let currentParent:any;
  let inVPre = false;
  let inPre = false;
  let warned = false; 

  function warnOnce (msg:string, range:any) {
    if (!warned) {
      warned = true
      warn(msg, range)
    }
  }

  function closeElement(element: ASTElement) { }

  function checkRootConstraints(el: any) { }

  parseHTML(template, {
    warn,
    expectHTML: options.expectHTML,
    isUnaryTag: options.isUnaryTag,
    canBeLeftOpenTag: options.canBeLeftOpenTag,
    shouldDecodeNewlines: options.shouldDecodeNewlines,
    shouldDecodeNewlinesForHref: options.shouldDecodeNewlinesForHref,
    shouldKeepComment: options.comments,
    outputSourceRange: options.outputSourceRange,
    start(tag: any, attrs: any, unary: any, start: any) { },
    end(tag: any, start: any, end: any) { },
    chars(text: string, start: number, end: number) { },
    comment(text: string, start: number, end: number) { }
  })
  return root;
}

function makeAttrsMap (attrs: Array<any>): Object {
  const map:any = {}
  for (let i = 0, l = attrs.length; i < l; i++) {
    if (
      process.env.NODE_ENV !== 'production' &&
      map[attrs[i].name] && !isIE && !isEdge
    ) {
      warn('duplicate attribute: ' + attrs[i].name, attrs[i])
    }
    map[attrs[i].name] = attrs[i].value
  }
  return map
}