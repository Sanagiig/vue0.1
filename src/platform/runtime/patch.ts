import { createPatchFunction } from '@core/vdom/patch';
// import * as nodeOps from '../../web/runtime/node-ops'
// import baseModules from '../../../core/vdom/modules/index'
// import platformModules from '../../web/runtime/modules/index'
let nodeOps = {};
let modules = {};

export const patch = createPatchFunction({ nodeOps, modules })