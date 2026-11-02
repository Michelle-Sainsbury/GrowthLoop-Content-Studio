const test=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const {createPresentationFrame,draftPages}=require('../.content-agent-test-build/presentation.js');
const base=process.env.DEMO_BASE_URL||'http://127.0.0.1:3100';
const artifacts=process.env.DEMO_ARTIFACT_DIR||path.resolve('test-results/presentation');
fs.mkdirSync(artifacts,{recursive:true});
let browser;
test.before(async()=>{browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});});
test.after(async()=>browser?.close());
async function setup(viewport={width:1440,height:900},reducedMotion='no-preference'){
 const context=await browser.newContext({viewport,reducedMotion});const page=await context.newPage();await page.clock.install({time:new Date('2026-11-02T12:00:00Z')});await page.clock.pauseAt(new Date('2026-11-02T12:00:01Z'));await page.goto(base);await page.getByRole('button',{name:/Watch Demo/}).waitFor();return {context,page};
}
async function launch(page){await page.getByRole('button',{name:/Watch Demo/}).click();await page.locator('[data-presentation-stage="opening"]').waitFor();}
async function assertFit(page){
 const result=await page.evaluate(()=>{
  const failures=[];const visible=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
  for(const e of document.querySelectorAll('.present-shell,.present-workspace,.present-loop-panel,.present-content,.present-footer,.present-controls,.present-paper,[data-essential]')){
   if(!visible(e))continue;
   const r=e.getBoundingClientRect();
   if(r.left<-.5||r.top<-.5||r.right>innerWidth+.5||r.bottom>innerHeight+.5)failures.push(`${e.className}: off viewport ${JSON.stringify({x:r.x,y:r.y,w:r.width,h:r.height})}`);
   if(e.scrollHeight>e.clientHeight+2||e.scrollWidth>e.clientWidth+2)failures.push(`${e.className}: overflow ${e.scrollHeight}/${e.clientHeight}, ${e.scrollWidth}/${e.clientWidth}`);
  }
  for(const post of document.querySelectorAll('.present-post')){
   if(!visible(post))continue;
   const paper=post.querySelector('.present-paper'),copy=post.querySelector('.present-post-copy'),footer=post.querySelector('footer');
   const paperBox=paper.getBoundingClientRect(),copyBox=copy.getBoundingClientRect(),footerBox=footer.getBoundingClientRect();
   if(copyBox.bottom>paperBox.bottom-parseFloat(getComputedStyle(paper).paddingBottom)+1)failures.push('Draft copy exceeds its paper surface');
   if(copyBox.bottom>footerBox.top+1)failures.push('Draft text overlaps its footer');
   if(paperBox.bottom>footerBox.top+1)failures.push('Paper surface overlaps its footer');
  }
  for(const e of document.querySelectorAll('.present-post-copy,.present-gate-result,.present-final-decisions,.present-narration p,.present-title h1')){
   if(!visible(e))continue;
   const range=document.createRange();range.selectNodeContents(e);
   for(const r of range.getClientRects()){
    let parent=e;
    while(parent&&parent!==document.body){const box=parent.getBoundingClientRect(),style=getComputedStyle(parent);if(/hidden|clip|auto|scroll/.test(style.overflowY)&&r.bottom>box.bottom+1)failures.push(`${e.className}: text clipped by ${parent.className}`);parent=parent.parentElement;}
    if(r.bottom>innerHeight+1||r.right>innerWidth+1||r.left<-.5)failures.push(`${e.className}: text offscreen`);
   }
   if(e.classList.contains('present-post-copy')&&parseFloat(getComputedStyle(e).fontSize)<15)failures.push('Draft copy below 15px');
  }
  for(const e of document.querySelectorAll('.present-workspace,.present-content,.present-paper'))if(/auto|scroll/.test(getComputedStyle(e).overflowY))failures.push('Scrolling container '+e.className);
  return failures;
 });assert.deepEqual(result,[]);
}
const samples=[1,11,25,33,41,49,57,69,76,83,90,97,109,117,125,133,141,151,156,162,168,175,180];
for(const viewport of [{width:1440,height:900},{width:1366,height:768},{width:1280,height:720},{width:1024,height:768},{width:820,height:740},{width:683,height:650},{width:390,height:844}])test(`ONE CLICK: complete 180-second story, no scrolling/clipping at ${viewport.width}x${viewport.height}`,async()=>{
 const {page,context}=await setup(viewport);const errors=[],outbound=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',request=>{if(new URL(request.url()).origin!==new URL(base).origin)outbound.push(request.url());});const seen=new Map();const geometry=[];
 try{
  await page.evaluate(()=>{window.__demoClicks=0;window.__demoScrolls=0;document.addEventListener('click',()=>window.__demoClicks++);});
  await launch(page);
  await page.evaluate(()=>document.querySelector('.present-theater').addEventListener('scroll',()=>window.__demoScrolls++,true));
  let time=0;
  for(const at of samples){
   await page.clock.runFor((at-time)*1000);time=at;
   await assertFit(page);
   const scene=await page.locator('[data-presentation-stage]').getAttribute('data-presentation-stage');geometry.push({at,scene,fit:true});
   if(['drafts','cycle-two','cycle-three'].includes(scene)){
    const index=scene==='drafts'?2:scene==='cycle-two'?4:6;const expected=createPresentationFrame(index).history.at(-1).posts;
    const visible=page.locator('.present-post:visible');
    for(const post of await visible.all()){
     const id=await post.getAttribute('data-draft-id'),part=await post.getAttribute('data-draft-page'),text=await post.locator('.present-post-copy').innerText();
     const full=expected.find(p=>p.id===id).content;
     assert.equal(text,part==='full'?full:draftPages(full)[Number(part)]);
     seen.set(`${index}-${id}-${part}`,text);
    }
   }
   if(at===151){assert.equal(await page.locator('[data-approved-variation]').getAttribute('data-approved-variation'),'none');assert.equal(await page.locator('[data-review-phase]').getAttribute('data-review-phase'),'review');}
   if(at===156)assert.equal(await page.locator('[data-review-phase]').getAttribute('data-review-phase'),'select');
   if(at===162)assert.equal(await page.locator('[data-review-phase]').getAttribute('data-review-phase'),'confirm');
   if(at===168){assert.equal(await page.locator('[data-review-phase]').getAttribute('data-review-phase'),'approved');assert.equal(await page.locator('[data-variation="A"]').getAttribute('data-status'),'unapproved');assert.equal(await page.locator('[data-variation="B"]').getAttribute('data-status'),'approved');}
   if([1,69,109,156,162,168,180].includes(at))await page.screenshot({animations:'disabled',path:path.join(artifacts,`autoplay-${viewport.width}-${at}.png`)});
  }
  for(const index of [2,4,6])for(const id of ['A','B']){
   const expected=createPresentationFrame(index).history.at(-1).posts.find(p=>p.id===id).content;
   assert.equal(seen.get(`${index}-${id}-full`)??[seen.get(`${index}-${id}-0`),seen.get(`${index}-${id}-1`)].join('\n\n'),expected,'Every character of each A/B draft must have been shown');
  }
  assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'),'180');
  await page.getByRole('heading',{name:'Variation B approved. Nothing was published.',exact:true}).waitFor();
  assert.match(await page.locator('[data-final-variation="A"]').innerText(),/Not approved/);assert.match(await page.locator('[data-final-variation="B"]').innerText(),/Approved in simulation/);
  assert.equal(await page.locator('[data-published]').getAttribute('data-published'),'false');assert.equal(await page.evaluate(()=>window.__demoClicks),1);assert.equal(await page.evaluate(()=>window.__demoScrolls),0);assert.deepEqual(errors,[]);assert.deepEqual(outbound,[],'No publishing or external service requests during the presentation');
  fs.writeFileSync(path.join(artifacts,`autoplay-${viewport.width}-evidence.json`),JSON.stringify({viewport,clicks:1,scrolls:0,seconds:180,approval:'B',unapproved:'A',published:false,geometry},null,2));
 }finally{await context.close();}
});
test('optional pause, next, play, replay and Escape preserve the separate manual campaign',async()=>{const {context,page}=await setup();try{await page.getByRole('button',{name:'Generate A/B Posts',exact:true}).click();const manual=await page.locator('.studio-post-copy').allTextContents();await launch(page);await page.getByRole('button',{name:'Pause presentation',exact:true}).click();const paused=await page.getByRole('progressbar').getAttribute('aria-valuenow');await page.clock.runFor(20000);assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'),paused);for(let i=0;i<2;i++)await page.getByRole('button',{name:'Next presentation stage',exact:true}).click();await page.locator('[data-presentation-stage="drafts"]').waitFor();await page.getByRole('button',{name:'Play presentation',exact:true}).click();await page.clock.runFor(33000);await page.locator('[data-presentation-stage="feedback-one"]').waitFor();await page.getByRole('button',{name:'Replay presentation',exact:true}).click();assert.equal(await page.locator('[data-approved-variation]').getAttribute('data-approved-variation'),'none');await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'detached'});assert.deepEqual(await page.locator('.studio-post-copy').allTextContents(),manual);await page.waitForFunction(()=>document.activeElement?.textContent.includes('Watch Demo'));}finally{await context.close();}});
test('reduced motion retains full automatic story, loop state and keyboard focus containment',async()=>{const {page,context}=await setup({width:1366,height:768},'reduce');try{await launch(page);assert.equal(await page.locator('.present-orbit-wide .present-orbit-motion').evaluate(el=>getComputedStyle(el).animationName),'none');await page.getByRole('button',{name:'Exit presentation and return to campaign'}).focus();await page.keyboard.press('Shift+Tab');assert.ok(await page.getByRole('button',{name:'Next presentation stage',exact:true}).evaluate(el=>el===document.activeElement));await page.keyboard.press('Tab');assert.ok(await page.getByRole('button',{name:'Exit presentation and return to campaign'}).evaluate(el=>el===document.activeElement));await page.clock.runFor(180000);assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'),'180');assert.equal(await page.locator('[data-approved-variation]').getAttribute('data-approved-variation'),'B');await assertFit(page);}finally{await context.close();}});
test('backgrounding pauses safely without auto-resume or hidden approval',async()=>{const {page,context}=await setup();try{await launch(page);await page.clock.runFor(1100);const before=await page.getByRole('progressbar').getAttribute('aria-valuenow');await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'hidden'});document.dispatchEvent(new Event('visibilitychange'));});await page.clock.runFor(180000);assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'),before);assert.equal(await page.locator('[data-approved-variation]').getAttribute('data-approved-variation'),'none');await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'visible'});document.dispatchEvent(new Event('visibilitychange'));});assert.ok(await page.getByRole('button',{name:'Play presentation',exact:true}).isEnabled());await page.getByRole('button',{name:'Play presentation',exact:true}).click();await page.clock.runFor(11000);await page.locator('[data-presentation-stage="brief"]').waitFor();}finally{await context.close();}});
test('scripted B approval never approves the separate real manual campaign',async()=>{const {page,context}=await setup();try{await page.getByRole('button',{name:'Generate A/B Posts',exact:true}).click();const before=await page.locator('.studio-post-copy').allTextContents();await launch(page);await page.clock.runFor(180100);assert.equal(await page.locator('[data-approved-variation]').getAttribute('data-approved-variation'),'B');await page.getByRole('button',{name:'Exit presentation and return to campaign',exact:true}).click();assert.deepEqual(await page.locator('.studio-post-copy').allTextContents(),before);assert.equal(await page.locator('.studio-preview.is-approved').count(),0);assert.equal(await page.locator('.studio-history-approved').count(),0);assert.equal(await page.locator('.studio-preview-action button:enabled').count(),2);}finally{await context.close();}});
