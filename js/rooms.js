import {firebaseConfig,FIREBASE_SDK_VERSION,firebaseReady} from './firebase-config.js';

let servicesPromise;
const sdkBase=`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}`;

export class FirebaseUnavailableError extends Error {
  constructor(){super('Онлайн-режим требует подключения Firebase.');this.name='FirebaseUnavailableError'}
}

export function normalizeRoomCode(value){
  const clean=String(value||'').trim().toUpperCase().replace(/[^A-Z0-9-]/g,'');
  const digits=clean.replace(/^DAV-?/,'');
  return /^\d{4}$/.test(digits)?`DAV-${digits}`:'';
}

export async function getFirebase(){
  if(!firebaseReady)throw new FirebaseUnavailableError();
  if(!servicesPromise)servicesPromise=(async()=>{
    const [{initializeApp},{getDatabase,ref,get,set,update,runTransaction,onValue,off,onDisconnect},{getAuth,signInAnonymously,onAuthStateChanged}]=await Promise.all([
      import(`${sdkBase}/firebase-app.js`),import(`${sdkBase}/firebase-database.js`),import(`${sdkBase}/firebase-auth.js`)
    ]);
    const app=initializeApp(firebaseConfig),db=getDatabase(app),auth=getAuth(app);
    if(!auth.currentUser)await signInAnonymously(auth);
    if(!auth.currentUser)await new Promise((resolve,reject)=>{const stop=onAuthStateChanged(auth,user=>{if(user){stop();resolve()}},reject)});
    return {db,auth,ref,get,set,update,runTransaction,onValue,off,onDisconnect};
  })();
  return servicesPromise;
}

function playerRecord(profile,uid){return {id:uid,name:profile.nickname,avatar:profile.avatar||'🎮'}}
function randomCode(){return `DAV-${Math.floor(1000+Math.random()*9000)}`}

export async function createRoom(game,profile,gameState){
  const f=await getFirebase(),uid=f.auth.currentUser.uid;let code='';
  for(let attempt=0;attempt<25;attempt++){
    const candidate=randomCode(),roomRef=f.ref(f.db,`rooms/${candidate}`),room={game,status:'waiting',createdAt:Date.now(),updatedAt:Date.now(),host:playerRecord(profile,uid),guest:null,turn:'host',gameState,result:null,drawOffer:null,rematch:{host:false,guest:false},presence:{[uid]:true}};
    const tx=await f.runTransaction(roomRef,current=>current?undefined:room,{applyLocally:false});
    if(tx.committed){code=candidate;break}
  }
  if(!code)throw new Error('Не удалось подобрать свободный код. Попробуйте ещё раз.');
  const presence=f.ref(f.db,`rooms/${code}/presence/${uid}`);await f.onDisconnect(presence).remove();return {code,role:'host',uid};
}

export async function joinRoom(rawCode,game,profile){
  const code=normalizeRoomCode(rawCode);if(!code)throw new Error('Введите код в формате DAV-1234.');
  const f=await getFirebase(),uid=f.auth.currentUser.uid,roomRef=f.ref(f.db,`rooms/${code}`),before=await f.get(roomRef);
  if(!before.exists())throw new Error('Комната не найдена. Проверьте код.');
  const current=before.val();if(current.game!==game)throw new Error('В этой комнате выбрана другая игра.');if(['finished','abandoned','closed'].includes(current.status))throw new Error('Матч в этой комнате уже завершён.');
  const existingRole=current.host?.id===uid?'host':current.guest?.id===uid?'guest':null;
  if(!existingRole&&current.guest)throw new Error('Комната уже занята.');
  if(!existingRole){
    const guestRef=f.ref(f.db,`rooms/${code}/guest`),guestTx=await f.runTransaction(guestRef,guest=>guest?undefined:playerRecord(profile,uid),{applyLocally:false});
    if(!guestTx.committed)throw new Error('Комната уже занята.');
  }
  const role=existingRole||'guest',presence=f.ref(f.db,`rooms/${code}/presence/${uid}`);
  await f.update(roomRef,{status:current.guest||role==='guest'?'playing':current.status,updatedAt:Date.now(),[`presence/${uid}`]:true});
  await f.onDisconnect(presence).remove();return {code,role,uid};
}

export async function watchRoom(code,onRoom,onError){const f=await getFirebase(),roomRef=f.ref(f.db,`rooms/${code}`),handler=snap=>onRoom(snap.exists()?snap.val():null);f.onValue(roomRef,handler,onError);return()=>f.off(roomRef,'value',handler)}

export async function commitGameState(code,identity,expectedRevision,nextGameState,nextTurn,result=null){
  const f=await getFirebase(),roomRef=f.ref(f.db,`rooms/${code}`),tx=await f.runTransaction(roomRef,room=>{if(!room||room.status!=='playing'||room.turn!==identity.role||room[identity.role]?.id!==identity.uid||(room.gameState?.revision||0)!==expectedRevision)return;room.gameState=nextGameState;room.turn=nextTurn;room.updatedAt=Date.now();if(result){room.result=result;room.status='finished'}return room},{applyLocally:false});
  if(!tx.committed)throw new Error('Ход отклонён: состояние партии уже изменилось.');return tx.snapshot.val();
}

export async function updateRoomAction(code,identity,action,payload={}){
  const f=await getFirebase(),roomRef=f.ref(f.db,`rooms/${code}`);return f.runTransaction(roomRef,room=>{if(!room||room[identity.role]?.id!==identity.uid)return;const opponent=identity.role==='host'?'guest':'host';if(action==='resign'&&room.status==='playing'){room.status='finished';room.result={winner:opponent,reason:'resign'};room.updatedAt=Date.now()}if(action==='draw'&&room.status==='playing')room.drawOffer=identity.role;if(action==='draw-decline')room.drawOffer=null;if(action==='draw-accept'&&room.drawOffer===opponent){room.status='finished';room.result={winner:null,reason:'draw'};room.drawOffer=null;room.updatedAt=Date.now()}if(action==='rematch'){room.rematch??={host:false,guest:false};room.rematch[identity.role]=true;if(room.rematch.host&&room.rematch.guest){room.status='playing';room.result=null;room.turn='host';room.gameState=payload.gameState;room.rematch={host:false,guest:false};room.drawOffer=null;room.updatedAt=Date.now()}}return room},{applyLocally:false})
}

export async function leaveRoom(code,identity){
  const f=await getFirebase(),roomRef=f.ref(f.db,`rooms/${code}`);await f.runTransaction(roomRef,room=>{if(!room||room[identity.role]?.id!==identity.uid)return room;if(identity.role==='host'&&['waiting','finished','abandoned','closed'].includes(room.status))return null;if(room.status==='playing'){room.status='abandoned';room.result={winner:identity.role==='host'?'guest':'host',reason:'disconnect'}}else room.status='closed';room.updatedAt=Date.now();if(room.presence)delete room.presence[identity.uid];return room},{applyLocally:false})
}

export async function markDisconnected(code,identity,missingRole){
  const f=await getFirebase(),roomRef=f.ref(f.db,`rooms/${code}`);return f.runTransaction(roomRef,room=>{if(!room||room.status!=='playing'||room[identity.role]?.id!==identity.uid||room.presence?.[room[missingRole]?.id])return room;room.status='abandoned';room.result={winner:identity.role,reason:'disconnect'};room.updatedAt=Date.now();return room},{applyLocally:false})
}
