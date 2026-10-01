const KEY='davgame-state-v1';
export const defaults={profile:null,settings:{sound:false,animations:true,theme:'dark'},stats:{played:0,wins:0,losses:0,draws:0,chess:0,checkers:0,battleship:0,points:0},history:[],tasks:{}};
export function load(){try{return {...structuredClone(defaults),...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return structuredClone(defaults)}}
export function save(state){localStorage.setItem(KEY,JSON.stringify(state))}
export function record(state,game,result,mode='Бот'){
 state.stats.played++; state.stats[result==='Победа'?'wins':result==='Поражение'?'losses':'draws']++;
 if(result==='Победа'){state.stats[game]++;state.stats.points+=100}
 const names={chess:'Шахматы',checkers:'Шашки',battleship:'Морской бой'};
 state.history.unshift({game:names[game],result,mode,date:new Date().toLocaleDateString('ru-RU')});state.history=state.history.slice(0,20);save(state)
}
export function resetStats(state){state.stats=structuredClone(defaults.stats);state.history=[];save(state)}
