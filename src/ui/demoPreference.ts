const key='tidal.demo.enabled';
/** Only an explicit opt-out disables the default local demonstration. */
export function readDemoPreference():boolean{
 try{return localStorage.getItem(key)!=='false';}catch{return true;}
}
export function saveDemoPreference(enabled:boolean):void{
 try{localStorage.setItem(key,String(enabled));}catch{/* Keep this page usable when browser storage is blocked. */}
}
