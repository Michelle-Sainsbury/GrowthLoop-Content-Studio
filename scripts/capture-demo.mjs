/* Local-only capture. No deployment, external recording service, or API keys. */
import { chromium } from 'playwright';
import { applyMobileVideoProfile } from './mobile-video.mjs';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const outputDir = path.resolve(process.env.DEMO_ARTIFACT_DIR || 'test-results/content-studio-demo');
const width=1080, height=1080, duration=78;
const mobileReadability = process.env.DEMO_MOBILE_READABILITY === '1';
fs.mkdirSync(outputDir,{recursive:true});
let server, browser;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function run(){
 const ffmpeg=process.env.FFMPEG_PATH || 'ffmpeg';
 if(spawnSync(ffmpeg,['-version']).status!==0)throw Error('FFmpeg is required for MP4 encoding. Install it and run again.');
 let baseURL=process.env.DEMO_BASE_URL;
 if(!baseURL){
  if(!fs.existsSync('.next/BUILD_ID'))throw Error('Run npm run build first; capture uses the local production app.');
  const port=process.env.DEMO_PORT || '3101';baseURL=`http://127.0.0.1:${port}`;
  server=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',port],{stdio:['ignore','pipe','pipe']});
  const messages=[];server.stdout.on('data',b=>messages.push(String(b)));server.stderr.on('data',b=>messages.push(String(b)));
  let ready=false;for(let i=0;i<60;i++){try{if((await fetch(baseURL)).ok){ready=true;break;}}catch{}if(server.exitCode!==null)throw Error('Local server failed: '+messages.join(''));await sleep(500);}
  if(!ready)throw Error('Local production server did not become ready.');
 }
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,reducedMotion:'no-preference',recordVideo:{dir:path.join(outputDir,'raw'),size:{width,height}}});
 const videoStarted=performance.now();const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(baseURL,{waitUntil:'networkidle'});
 if (mobileReadability) await applyMobileVideoProfile(page);
 // Presentation-only styling. No Content state or timing is substituted.
 await page.addStyleTag({content:'.demo-close,.demo-controls button{visibility:hidden!important}'});
 const trace=[];await page.exposeFunction('recordDemoStep',step=>{trace.push({step,recordedAt:new Date().toISOString()});console.log('Captured chapter:',step);});
 await page.evaluate(()=>new MutationObserver(()=>{const el=document.querySelector('[data-demo-step]');const step=el?.getAttribute('data-demo-step');if(step&&step!==window.__lastRecordedDemoStep){window.__lastRecordedDemoStep=step;window.recordDemoStep(step);}}).observe(document.body,{subtree:true,attributes:true,childList:true,attributeFilter:['data-demo-step']}));
 await page.getByRole('button',{name:/Watch 78-second film/}).click();const demoStarted=performance.now();
 await page.waitForTimeout(1000);
 await page.screenshot({path:path.join(outputDir,'poster.png')});
 await page.waitForFunction(()=>document.querySelector('.demo-progress')?.getAttribute('aria-valuenow')==='78',null,{timeout:95000});
 await page.waitForTimeout(1200);
 if(errors.length)throw Error('Browser errors: '+errors.join('; '));
 if(trace.length!==10)throw Error(`Expected all 10 actual chapters, captured ${trace.length}.`);
 await page.screenshot({path:path.join(outputDir,'final-frame.png')});
 const video=page.video();await context.close();const raw=await video.path();
 await browser.close();browser=null;
 const trim=(demoStarted-videoStarted)/1000+.35;
 const mp4=path.join(outputDir,mobileReadability ? 'GrowthLoop-Content-Studio-Mobile-78s.mp4' : 'GrowthLoop-Content-Studio-78s.mp4');
 console.log('Encoding LinkedIn-ready H.264 MP4…');
 const encode=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-y','-ss',trim.toFixed(3),'-i',raw,'-t',String(duration),'-vf','scale=1080:1080:flags=lanczos,setsar=1,fps=30,tpad=stop_mode=clone:stop_duration=2','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart','-an',mp4],{encoding:'utf8',maxBuffer:4*1024*1024});
 if(encode.status!==0)throw Error(encode.stderr || 'FFmpeg encoding failed.');
 fs.writeFileSync(path.join(outputDir,'capture-evidence.json'),JSON.stringify({mode:'Local production app; actual wall-clock playback and Content logic; simulated reviewer; no model calls',dimensions:{width,height},mobileReadability,targetDuration:duration,trace,browserErrors:errors,raw,mp4,trimSeconds:trim,audio:'Silent; readable on-screen captions'},null,2));
 console.log('Video:',mp4);
}
run().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill('SIGTERM');});
