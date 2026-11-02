import { chromium } from 'playwright';
import { applyMobileVideoProfile } from './mobile-video.mjs';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {createDemoFrame}=require('../.content-agent-test-build/demo.js');
const dir=process.env.DEMO_ARTIFACT_DIR || 'test-results/mobile-video';
fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox']});
const scenes=[['opening',1],['brief',8],['drafts',16],['feedback-one',26],['cycle-two',34],['feedback-two',44],['cycle-three',52],['history',61],['approval',69],['ending',76]];
const results=[];
try {
 const page=await browser.newPage({viewport:{width:1080,height:1080},reducedMotion:'reduce'});
 await page.clock.install({time:new Date('2026-10-30T00:00:00Z')});
 await page.clock.pauseAt(new Date('2026-10-30T00:00:01Z'));
 await page.goto(process.env.DEMO_BASE_URL || 'http://127.0.0.1:3102');
 await applyMobileVideoProfile(page);
 await page.getByRole('button',{name:/Watch 78-second film/}).click();
 let seconds=0;
 for(let i=0;i<scenes.length;i++){
  const [scene,at]=scenes[i];
  await page.clock.runFor((at-seconds)*1000);seconds=at;
  await page.locator(`[data-demo-step="${scene}"]`).waitFor();
  const geometry=await page.evaluate(()=>{
   const rect=el=>{const r=el.getBoundingClientRect();return {top:r.top,left:r.left,right:r.right,bottom:r.bottom};};
   const nodes=[...document.querySelectorAll('.demo-heading h1,.demo-disclosure,.demo-caption,.demo-post,.demo-feedback-card,.demo-brief-card,.demo-history-card,.demo-ending,.demo-opening')];
   return {elements:nodes.map(el=>({selector:el.className||el.tagName,rect:rect(el)})),stage:rect(document.querySelector('.demo-stage')),scene:rect(document.querySelector('.demo-scene')),caption:rect(document.querySelector('.demo-bottom')),captionFont:parseFloat(getComputedStyle(document.querySelector('.demo-caption p')).fontSize),draftFonts:[...document.querySelectorAll('.demo-post-paper>p')].map(el=>parseFloat(getComputedStyle(el).fontSize)),horizontalOverflow:document.querySelector('.demo-theater').scrollWidth>innerWidth};
  });
  assert.equal(geometry.horizontalOverflow,false,scene+' horizontal overflow');
  assert.ok(geometry.stage.bottom<=1080.5,scene+' stage exceeds video: '+geometry.stage.bottom);
  assert.ok(geometry.captionFont>=29,scene+' caption size');
  assert.ok(geometry.scene.bottom<=geometry.caption.top+1,scene+' scene overlaps caption');
  for(const element of geometry.elements){assert.ok(element.rect.left>=0 && element.rect.right<=1080.5 && element.rect.top>=0 && element.rect.bottom<=1080.5,scene+' clipped '+element.selector);}
  if(geometry.draftFonts.length){
   assert.ok(geometry.draftFonts.every(size=>size>=28));
   assert.deepEqual(await page.locator('.demo-post-paper>p').allTextContents(),createDemoFrame(i).loop.history.at(-1).posts.map(post=>post.content));
  }
  const caption=await page.locator('.demo-caption').innerText();
  if(scene==='approval')assert.match(await page.locator('.demo-post-approved').innerText(),/simulated reviewer/);
  results.push({scene,at,caption,geometry});
  await page.screenshot({path:path.join(dir,scene+'.png')});
 }
 await page.clock.runFor(2500);assert.match(await page.locator('.demo-controls button').textContent(), /Replay demo/);
 fs.writeFileSync(path.join(dir,'layout-verification.json'),JSON.stringify({scenes:results.length,passed:true,results},null,2));
 console.log('PASS: all 10 scenes fit 1080×1080; caption 29px; draft 28px; exact copy preserved; approval and ending verified.');
} finally {await browser.close();}
