import type {ActionPhase} from '../../domain/types.js';
export interface Vec3{x:number;y:number;z:number}
export interface WorldActor{position:Vec3;yaw:number;mode:'idle'|'work'|'walk'|'push'|'pull'|'secure'|'celebrate';pose:ActionPhase;stride:number}
export interface WorldLog{id:number;location:'ground'|'hand'|'flight'|'cart'|'delivered';position:Vec3;rotation:number}
export interface WorldFrame{player:WorldActor;npc:WorldActor;cart:Vec3;logs:WorldLog[];trees:{position:Vec3;felled:boolean;fallProgress:number}[];ropeProgress:number;carryProgress:number;action:ActionPhase;effects:{kind:'impact'|'tree'|'log';index:number;progress:number}[]}
