const key='tidal.demo.enabled';
/** Automatic demonstration requires an explicitly saved opt-in. */
export function readDemoPreference():boolean{
 try{return localStorage.getItem(key)==='true';}catch{return false;}
}
export function saveDemoPreference(enabled:boolean):void{
 try{localStorage.setItem(key,String(enabled));}catch{/* Keep this page usable when browser storage is blocked. */}
}
