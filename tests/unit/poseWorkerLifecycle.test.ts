import {expect,test,vi,afterEach} from 'vitest';
import {PoseWorkerClient,type WorkerPort} from '../../src/pose/poseWorkerClient.js';
import type {WorkerRequest,WorkerResponse} from '../../src/pose/types.js';
afterEach(()=>vi.useRealTimers());
class WorkerStub implements WorkerPort{
  onmessage:((e:MessageEvent<WorkerResponse>)=>void)|null=null;onerror:((e:ErrorEvent)=>void)|null=null;terminated=0;
  ready=true;disposeThrows=false;
  postMessage(m:WorkerRequest){if(m.kind==='init'&&this.ready)queueMicrotask(()=>this.onmessage?.({data:{kind:'ready',sourceEpoch:m.sourceEpoch}} as MessageEvent<WorkerResponse>));if(m.kind==='dispose'&&this.disposeThrows)throw new Error('port closed');}
  terminate(){this.terminated++;}
}
const video={videoWidth:640,videoHeight:480,readyState:4} as HTMLVideoElement;
test('initialization timeout rejects once and terminates a worker without a dispose reply',async()=>{
  vi.useFakeTimers();const port=new WorkerStub();port.ready=false;const errors:string[]=[];
  const c=new PoseWorkerClient(()=>port,async()=>({close(){}}) as ImageBitmap,'http://localhost/');
  const pending=c.start(()=>{},m=>errors.push(m)).catch(e=>e);await vi.advanceTimersByTimeAsync(30301);
  expect(await pending).toBeInstanceOf(Error);expect(errors).toHaveLength(1);expect(port.terminated).toBe(1);await c.stop();expect(port.terminated).toBe(1);
});
test('frame timeout stops inference and ignores late callback',async()=>{
  vi.useFakeTimers();const port=new WorkerStub(),frames:unknown[]=[],errors:string[]=[];
  const c=new PoseWorkerClient(()=>port,async()=>({close(){}}) as ImageBitmap,'http://localhost/');await c.start(f=>frames.push(f),m=>errors.push(m));
  c.submit(video,1);await vi.advanceTimersByTimeAsync(10301);expect(errors).toHaveLength(1);expect(errors[0]).toContain('推理超时');expect(port.terminated).toBe(1);expect(frames).toEqual([]);
});
test('a dispose postMessage failure still terminates and resolves stop',async()=>{
  const port=new WorkerStub();port.disposeThrows=true;
  const c=new PoseWorkerClient(()=>port,async()=>({close(){}}) as ImageBitmap,'http://localhost/');await c.start(()=>{});
  await expect(c.stop()).resolves.toBeUndefined();expect(port.terminated).toBe(1);
});
