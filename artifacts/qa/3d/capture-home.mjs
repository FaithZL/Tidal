// Real production homepage, no fake device, test mode or clock acceleration.
import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:1366,height:900}});
 await page.goto('http://127.0.0.1:4175/');
 await expect(page.locator('#worldCanvas')).toHaveAttribute('data-renderer',/^Three\.js/);
 await expect(page.locator('#planCarry')).toContainText('60 秒');
 await expect(page.locator('#testModeBadge')).toBeHidden();
 await expect(page.locator('#worldCanvas')).toHaveAttribute('data-inventory','0/0/0');
 await page.screenshot({path:'artifacts/qa/3d/production-home.png'});
}finally{await browser.close();}
