import assert from 'node:assert/strict';
import {createGame,apply,tick} from '../app/lib/mech.ts';
const t='a'.repeat(48),s=createGame(t,'Leader',100000);apply(s,t,{action:'start'},100000);
const failures=[];
tick(s,100500);tick(s,100250);if(s.tick!==100500)failures.push('An older concurrent request rewinds the simulation clock.');
// Last enemy falls while another pilot is awaiting the documented six-second respawn.
const s2=createGame(t,'Leader',100000);apply(s2,'b'.repeat(48),{action:'join',name:'Wingman'},100000);apply(s2,t,{action:'start'},100000);s2.players[1].hp=0;s2.players[1].deadAt=100000;s2.bots=[];tick(s2,100250);if(s2.players[1].hp>0)failures.push('Wave-clear armor bonus revives a downed pilot before the respawn timer/cost.');
// Core can be consumed by a respawn during the intermission.
const s3=createGame(t,'Leader',100000);apply(s3,t,{action:'start'},100000);s3.phase='intermission';s3.next=120000;s3.core=20;s3.players[0].hp=0;s3.players[0].deadAt=100000;tick(s3,106250);if(s3.core===0&&s3.phase!=='defeat')failures.push('A core depleted by respawning during intermission does not immediately end the match.');
assert.deepEqual(failures,[]);
console.log('PASS: monotonic clock, downed-pilot wave bonus, and core loss during intermission.');

// An older client timestamp must not rewind movement/heartbeat accounting either.
apply(s,t,{action:'sync',x:s.players[0].x,y:s.players[0].y},100100);
assert(s.players[0].seen>=100500);
assert(s.players[0].moveAt>=100500);
// A downed pilot stays down through wave clear, then pays the normal respawn cost.
assert.equal(s2.players[1].hp,0);tick(s2,106250);assert.equal(s2.players[1].hp,100);assert.equal(s2.core,575);
