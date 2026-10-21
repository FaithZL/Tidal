/** Preserve existing DOM nodes and avoid layout/paint invalidation for unchanged HUD values. */
export function setProperty<T,K extends keyof T>(target:T,key:K,value:T[K]):T[K]{
 if(target[key]!==value)target[key]=value;return value;
}
export function setAttribute(target:Element,name:string,value:string):void{
 if(target.getAttribute(name)!==value)target.setAttribute(name,value);
}
export function setClass(target:Element,name:string,enabled:boolean):void{
 if(target.classList.contains(name)!==enabled)target.classList.toggle(name,enabled);
}
