import {expect,test} from 'vitest';
import {readRecognitionLeniency,saveRecognitionLeniency,recognitionPreferenceKey} from '../../src/ui/recognitionPreference.js';

test('valid saved leniency is restored, invalid and unavailable storage safely uses standard',()=>{
 expect(readRecognitionLeniency({getItem:()=> '5'})).toBe(5);
 for(const value of [null,'','0','6','1.5','NaN','Infinity','{}','not-a-level'])expect(readRecognitionLeniency({getItem:()=>value})).toBe(3);
 expect(readRecognitionLeniency({getItem(){throw new Error('blocked');}})).toBe(3);
});
test('saving writes only the validated leniency key and handles a failed write',()=>{
 const writes:[string,string][]=[];
 expect(saveRecognitionLeniency(1,{setItem(key,value){writes.push([key,value]);}})).toBe(true);
 expect(writes).toEqual([[recognitionPreferenceKey,'1']]);
 for(const value of [0,6,2.5,Number.NaN])expect(saveRecognitionLeniency(value,{setItem(key,value){writes.push([key,value]);}})).toBe(false);
 expect(writes).toHaveLength(1);expect(saveRecognitionLeniency(4,{setItem(){throw new Error('quota');}})).toBe(false);
});
