import { observe } from '../../src/core/observer/index';
import Watcher from '@core/observer/watcher';

// obj test
let vm:{[key:string]:any} = {
    inp1:'',
    inp2: '',
    list:[0,1,2,3,4],
    _watchers:[]
}


let watchers = [];
let keys = Object.keys(vm);
observe(vm);

// trigger
keys.forEach((key:any) => {
    if (key === '_watchers' || key ==='list') return;
    // console.log('dom',(<any>document.getElementById(key + '_input')));
    (<any>document.getElementById(key + '_input')).addEventListener('input', function (e:any) {
        console.log('change',e)
        vm[key] = e.target.value;
    })
})

// watcher
keys.forEach(key => {
    if (key === '_watchers' || key ==='list') return;
    watchers.push(new Watcher(vm, key, function (newv: any, oldv: any) {
        let dom: any = document.getElementById(key);
        // console.log('dom...', dom);
        console.log(`old is [${oldv}] \n new is [${newv}]`);
        dom.innerHTML = newv;
    }))
})

vm.list.forEach((item: any, index: number) => {
    watchers.push(new Watcher(vm, `list.${index}`, function (newv: any, oldv: any) {
        let dom:any = document.getElementById('li' + index);
        dom.innerHTML = newv; 
    }))
})

setInterval(() => {
    for (let i = 0; i < vm.list.length; i++){
        vm.list[i] = i +'  -  ' + new Date();
    }
    vm.list.splice(1, 1);
    console.log('vm...', vm.list);
}, 1000)

console.log(vm);
// console.log(vm.list.splice(1,1))
// console.log(vm.list.splice(1,1))
// console.log(vm.list.splice(1,1))