const test = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const path = require('node:path');
const baseURL = process.env.DEMO_BASE_URL || 'http://127.0.0.1:3100';
const screenshots = process.env.DEMO_ARTIFACT_DIR || path.resolve('test-results');
const fs = require('node:fs');
fs.mkdirSync(screenshots,{recursive:true});
let browser;
test.before(async()=>{browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});});
test.after(async()=>{await browser?.close();});
async function pageFor(viewport={width:1080,height:1080},reducedMotion='no-preference'){
 const context=await browser.newContext({viewport,reducedMotion});
 const page=await context.newPage();
 await page.clock.install({time:new Date('2026-11-02T12:00:00Z')});await page.clock.pauseAt(new Date('2026-11-02T12:00:01Z'));
 await page.goto(baseURL);
 await page.getByRole('button',{name:/Watch 78-second film/}).waitFor();
 return {page,context};
}
async function assertStep(page,name){await page.locator(`[data-demo-step="${name}"]`).waitFor();}
const copy = page=>page.locator('.demo-post-paper>p').allTextContents();
test('automatic demo runs real three-cycle outputs, history, explicit simulated approval and stop',async()=>{
 const {page,context}=await pageFor();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.getByRole('button',{name:/Watch 78-second film/}).click();
  await assertStep(page,'opening');
  assert.match(await page.locator('.demo-disclosure').innerText(),/SIMULATED HUMAN ACTIONS/);
  await page.clock.runFor(6100);await assertStep(page,'brief');
  assert.match(await page.locator('.demo-brief-card').innerText(),/Nonprofit teams/);
  await page.clock.runFor(8100);await assertStep(page,'drafts');
  assert.equal(await page.locator('.demo-post').count(),2);const first=await copy(page);
  await page.screenshot({animations:'disabled',path:path.join(screenshots,'cycle-1.png')});
  await page.clock.runFor(10000);await assertStep(page,'feedback-one');
  await page.clock.runFor(7000);await assertStep(page,'cycle-two');const second=await copy(page);assert.notDeepEqual(second,first);
  await page.screenshot({animations:'disabled',path:path.join(screenshots,'cycle-2.png')});
  await page.clock.runFor(10000);await assertStep(page,'feedback-two');
  await page.clock.runFor(7000);await assertStep(page,'cycle-three');const third=await copy(page);assert.notDeepEqual(third,second);
  for(const text of [...first,...second,...third])assert.ok(text.includes('GrantReady is a hypothetical product for this demonstration.'));
  assert.ok(third[1].includes('What practical step would you prioritize?'));
  await page.screenshot({animations:'disabled',path:path.join(screenshots,'cycle-3.png')});
  await page.clock.runFor(10000);await assertStep(page,'history');assert.equal(await page.locator('.demo-history-card li').count(),3);
  await page.clock.runFor(8000);await assertStep(page,'approval');assert.equal(await page.locator('.demo-post-approved').count(),1);
  assert.match(await page.locator('.demo-post-approved').innerText(),/Approved by simulated reviewer/);
  await page.clock.runFor(6000);await assertStep(page,'ending');
  await page.clock.runFor(7000);await page.getByRole('button',{name:'Replay demo'}).waitFor();
  assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'),'78');
  await page.screenshot({animations:'disabled',path:path.join(screenshots,'ending.png')});
  await page.getByRole('button',{name:'Replay demo'}).click();await assertStep(page,'opening');
  assert.equal(await page.locator('.demo-post').count(),0);assert.deepEqual(errors,[]);
 }finally{await context.close();}
});
test('pause holds time; Escape restores an untouched manual campaign and keyboard focus',async()=>{
 const {page,context}=await pageFor();
 try{
  await page.getByRole('button',{name:'Generate A/B Posts'}).click();
  const original=await page.locator('.studio-post-copy').allTextContents();
  await page.getByRole('button',{name:/Watch 78-second film/}).click();
  await page.getByRole('button',{name:'Pause demo'}).click();
  const paused=await page.getByRole('progressbar').getAttribute('aria-valuenow');
  await page.clock.runFor(20000);assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'),paused);
  await page.getByRole('button',{name:'Resume demo'}).click();await page.clock.runFor(7000);await assertStep(page,'brief');
  await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'detached'});
  assert.deepEqual(await page.locator('.studio-post-copy').allTextContents(),original);
  assert.match(await page.locator('.studio-drafts .studio-cycle').innerText(),/Cycle 1/);
  await page.waitForFunction(()=>document.activeElement?.textContent.includes('Watch 78-second film'));
 }finally{await context.close();}
});
test('original manual workflow preserves validation, feedback rejection, cap and approval stopping',async()=>{
 const {page,context}=await pageFor();
 try{
  await page.getByRole('textbox',{name:'Target audience'}).fill('');
  await page.getByRole('button',{name:'Generate A/B Posts'}).click();assert.match(await page.locator('.studio-error[role="alert"]').innerText(),/audience/i);
  await page.getByRole('textbox',{name:'Target audience'}).fill('Community teams');
  await page.getByRole('button',{name:'Generate A/B Posts'}).click();const first=await page.locator('.studio-post-copy').allTextContents();
  const feedback=page.getByRole('textbox',{name:'Human revision feedback'});
  await feedback.fill('Invent a grant statistic');await page.getByRole('button',{name:'Request Revision'}).click();assert.match(await page.locator('.studio-error[role="alert"]').innerText(),/human review/);
  await feedback.fill('Make it shorter');await page.getByRole('button',{name:'Request Revision'}).click();assert.notDeepEqual(await page.locator('.studio-post-copy').allTextContents(),first);
  await feedback.fill('More detailed. Ask a question.');await page.getByRole('button',{name:'Request Revision'}).click();
  assert.equal(await page.locator('.studio-timeline li').count(),3);
  await feedback.fill('shorter');await page.getByRole('button',{name:'Request Revision'}).click();assert.match(await page.locator('.studio-error[role="alert"]').innerText(),/Maximum revision cycles/);
  await page.getByRole('button',{name:'Approve Variation B'}).click();
  assert.match(await page.locator('.studio-history-approved').innerText(),/No further revision cycle/);
  assert.equal(await page.getByRole('button',{name:'Request Revision'}).count(),0);
  assert.equal(await page.locator('.studio-preview-action button:disabled').count(),2);
  await page.getByRole('button',{name:'Start New Campaign'}).click();assert.equal(await page.locator('.studio-timeline li').count(),1);
 }finally{await context.close();}
});
test('desktop and mobile scenes have no horizontal overflow; mobile manual controls remain usable',async()=>{
 for(const viewport of [{width:1440,height:1000},{width:390,height:844},{width:768,height:1024}]){
  const {page,context}=await pageFor(viewport);
  try{
   await page.getByRole('button',{name:/Watch 78-second film/}).click();await page.clock.runFor(48500);await assertStep(page,'cycle-three');
   assert.equal(await page.evaluate(()=>document.querySelector('.demo-theater').scrollWidth>innerWidth),false);
   await page.screenshot({animations:'disabled',path:path.join(screenshots,`demo-${viewport.width}.png`),fullPage:true});
   await page.getByRole('button',{name:/Close demo/}).click();
   await page.getByRole('button',{name:'Generate A/B Posts'}).click();
   await page.getByRole('textbox',{name:'Human revision feedback'}).fill('shorter');
   await page.getByRole('button',{name:'Request Revision'}).click();assert.match(await page.locator('.studio-drafts .studio-cycle').innerText(),/Cycle 2/);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }finally{await context.close();}
 }
});
test('reduced motion removes decorative animations while playback and focus containment work',async()=>{
 const {page,context}=await pageFor({width:1080,height:1080},'reduce');
 try{
  await page.getByRole('button',{name:/Watch 78-second film/}).click();
  assert.equal(await page.locator('.demo-opening>svg').evaluate(e=>getComputedStyle(e).animationName),'none');
  await page.getByRole('button',{name:'Pause demo'}).click();await page.keyboard.press('Tab');
  assert.ok(await page.getByRole('button',{name:/Close demo/}).evaluate(e=>e===document.activeElement));
  await page.keyboard.press('Shift+Tab');assert.ok(await page.getByRole('button',{name:'Resume demo'}).evaluate(e=>e===document.activeElement));
  await page.getByRole('button',{name:'Resume demo'}).click();await page.clock.runFor(32000);await assertStep(page,'cycle-two');
 }finally{await context.close();}
});
