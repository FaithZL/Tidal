import {defaultRecognitionLeniency,isRecognitionLeniency} from '../config/recognitionTolerance.js';
export const recognitionPreferenceKey='tidal.recognition.leniency.v1';
export function readRecognitionLeniency(storage?:Pick<Storage,'getItem'>):number{
 try{const value=Number((storage??localStorage).getItem(recognitionPreferenceKey));return isRecognitionLeniency(value)?value:defaultRecognitionLeniency;}
 catch{return defaultRecognitionLeniency;}
}
export function saveRecognitionLeniency(level:number,storage?:Pick<Storage,'setItem'>):boolean{
 if(!isRecognitionLeniency(level))return false;
 try{(storage??localStorage).setItem(recognitionPreferenceKey,String(level));return true;}catch{return false;}
}
