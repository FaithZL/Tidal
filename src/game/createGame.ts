import type { DemoConfig } from '../config/demoConfig.js';
import type { SessionController } from '../domain/types.js';
import {FarmWorld,type GameView} from './world/FarmWorld.js';

/** Rendering subscribes to authority; it never advances the session clock. */
export function createGame(parent: HTMLElement, controller: SessionController, config: Readonly<DemoConfig>,onError:(message:string)=>void=()=>{}):GameView {
  try{return new FarmWorld(parent,controller,config,onError);}
  catch(error){const message=`无法启动3D画面：${error instanceof Error?error.message:String(error)}`;parent.dataset.error=message;const node=document.createElement('p');node.id='renderError';node.setAttribute('role','alert');node.textContent=message;parent.appendChild(node);queueMicrotask(()=>onError(message));return{destroy(){node.remove();},rotate(){},resetView(){},focusCastle(){},setInteractionEnabled(){}};}
}
