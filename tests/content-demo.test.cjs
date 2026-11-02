const test = require('node:test');
const assert = require('node:assert/strict');
const { createDemoFrame, DEMO_BEATS, DEMO_BRIEF, DEMO_DURATION, DEMO_FEEDBACK, demoBeatAt } = require('../.content-agent-test-build/demo.js');
const { startRevisionLoop, revisePosts } = require('../.content-agent-test-build/revision-loop.js');
const { approvePost } = require('../.content-agent-test-build/approve-posts.js');
test('demo uses actual generation and revision outputs at all three cycles', () => {
 const one=startRevisionLoop(DEMO_BRIEF);
 const two=revisePosts(one,DEMO_BRIEF,DEMO_FEEDBACK[0]);
 const three=revisePosts(two,DEMO_BRIEF,DEMO_FEEDBACK[1]);
 assert.deepEqual(createDemoFrame(2).loop,one);
 assert.deepEqual(createDemoFrame(4).loop,two);
 assert.deepEqual(createDemoFrame(6).loop,three);
 assert.notEqual(one.history[0].posts[1].content, two.history[1].posts[1].content);
 assert.notEqual(two.history[1].posts[1].content, three.history[2].posts[1].content);
 for(const entry of three.history)for(const p of entry.posts)assert.ok(p.content.includes(DEMO_BRIEF.approvedClaims[0]));
});
test('simulated approval uses real approval and never starts a fourth cycle',()=>{
 const frame=createDemoFrame(8);
 assert.deepEqual(frame.approval,approvePost(frame.loop.history[2].posts,'B',true));
 assert.equal(frame.loop.currentCycle,3);
 assert.equal(frame.loop.history.length,3);
 assert.deepEqual(createDemoFrame(9),frame);
 assert.throws(()=>revisePosts(frame.loop,DEMO_BRIEF,'shorter'),/Maximum revision cycles/);
});
test('demo does not show future history or approval',()=>{
 assert.equal(createDemoFrame(0).loop,null);
 assert.equal(createDemoFrame(1).loop,null);
 for(let i=2;i<8;i++)assert.equal(createDemoFrame(i).approval,null);
 assert.equal(createDemoFrame(3).loop.history.length,1);
 assert.equal(createDemoFrame(5).loop.history.length,2);
});
test('78-second timeline has ordered beats and explicit boundary behavior',()=>{
 assert.equal(DEMO_DURATION,78);
 for(let i=0;i<DEMO_BEATS.length;i++){
  assert.equal(demoBeatAt(DEMO_BEATS[i].at),i);
  if(i)assert.equal(demoBeatAt(DEMO_BEATS[i].at-0.01),i-1);
 }
 assert.equal(demoBeatAt(78),9);
 assert.throws(()=>createDemoFrame(-1),/Invalid/);
 assert.throws(()=>createDemoFrame(10),/Invalid/);
 assert.throws(()=>createDemoFrame(1.5),/Invalid/);
});
