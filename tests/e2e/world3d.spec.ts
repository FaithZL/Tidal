import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
test('real 3D farm renders and orbiting changes camera and projected geometry without adding exercise',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await expect(page.locator('#worldCanvas')).toHaveAttribute('data-renderer',/^Three.js/);
 await page.locator('#cancelPlan').click();const world=page.locator('#worldCanvas');
 const initial=await world.getAttribute('data-camera'),projected=await world.getAttribute('data-probe');
 const canvas=page.locator('#worldCanvas canvas'),box=(await canvas.boundingBox())!;
 await page.mouse.move(box.x+box.width*.45,box.y+box.height*.45);await page.mouse.down();
 await page.mouse.move(box.x+box.width*.65,box.y+box.height*.48,{steps:15});await page.mouse.up();
 await expect(world).not.toHaveAttribute('data-camera',initial!);await expect(world).not.toHaveAttribute('data-probe',projected!);
 await expect(page.locator('#chopValue')).toHaveText('0/15');
 await mkdir('artifacts/qa/3d',{recursive:true});await page.screenshot({path:'artifacts/qa/3d/orbit.png'});
 expect(errors).toEqual([]);
});
