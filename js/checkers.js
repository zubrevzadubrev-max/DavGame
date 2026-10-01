import {record} from './storage.js?v=6';
import {toast,formatTime,modal} from './ui.js?v=6';
import {createCheckersState,checkersLegalMoves,checkersAllMoves,applyCheckersMove} from './rules.js?v=6';

export function mountCheckers(root,appState,level='medium'){
  let position=createCheckersState(),selected=null,legal=[],seconds=0,over=false;
  root.innerHTML=layout();const board=root.querySelector('.board'),timer=root.querySelector('.timer'),status=root.querySelector('[data-status]');render();
  const tick=setInterval(()=>{if(!over){seconds++;timer.textContent=formatTime(seconds)}},1000);root._cleanup=()=>clearInterval(tick);
  root.querySelector('[data-restart]').onclick=()=>{position=createCheckersState();selected=null;legal=[];over=false;seconds=0;render()};
  root.querySelector('[data-resign]').onclick=()=>modal({title:'Сдаться?',text:'Результат сохранится в статистике.',danger:true,confirm:'Сдаться',onConfirm:()=>finish('Поражение')});

  function layout(){return `<div class="game-layout"><div class="game-panel board-panel"><div class="board checkers-board" aria-label="Доска для шашек"></div></div><div class="game-info"><div class="game-panel"><div class="player-row" data-bot><div class="face">🧠</div><span><b>BOT / ${level.toUpperCase()}</b><small>Светлые</small></span></div><div class="timer">00:00</div><div class="player-row active" data-you><div class="face">${appState.profile.avatar}</div><span><b>${appState.profile.nickname}</b><small>Красные</small></span></div></div><div class="game-panel"><h3 class="panel-title" data-status>Ваш ход</h3><p class="muted">Взятие обязательно. После прыжка серия продолжается той же шашкой.</p><button class="btn btn-secondary btn-wide" data-restart>Новая партия</button><button class="btn btn-ghost btn-wide" style="margin-top:8px" data-resign>Сдаться</button></div></div>`}
  function render(){
    board.innerHTML='';for(let r=0;r<8;r++)for(let c=0;c<8;c++){
      const square=document.createElement('button'),piece=position.board[r][c];square.type='button';square.className=`square ${(r+c)%2?'dark':'light'}`;
      if(selected&&same(selected,[r,c]))square.classList.add('selected');if(legal.some(x=>same(x,[r,c])))square.classList.add('legal');if(position.lastMove&&(same(position.lastMove.from,[r,c])||same(position.lastMove.to,[r,c])))square.classList.add('last-move');
      if(piece)square.innerHTML=`<span class="checker ${piece.toLowerCase()==='r'?'red':'cream'} ${piece===piece.toUpperCase()?'king':''}"></span>`;square.onclick=()=>click(r,c);board.append(square);
    }
    status.textContent=over?'Партия завершена':position.forced&&position.turn==='r'?'Продолжите взятие':position.turn==='r'?'Ваш ход':'Бот думает…';root.querySelector('[data-you]').classList.toggle('active',position.turn==='r');root.querySelector('[data-bot]').classList.toggle('active',position.turn==='c');
  }
  function click(r,c){if(over||position.turn!=='r')return;const piece=position.board[r][c];if(selected&&legal.some(x=>same(x,[r,c]))){play(selected,[r,c],false);return}if(piece?.toLowerCase()==='r'){selected=[r,c];legal=checkersLegalMoves(position,r,c)}else{selected=null;legal=[]}render()}
  function play(from,to,botMove){const next=applyCheckersMove(position,from,to);if(!next)return;position=next;selected=position.forced;legal=selected?checkersLegalMoves(position,...selected):[];render();if(position.result)return finish(position.result.winner==='r'?'Победа':'Поражение');if(!botMove&&position.turn==='c')setTimeout(bot,320)}
  function bot(){if(over||position.turn!=='c')return;const moves=checkersAllMoves(position,'c');if(!moves.length)return finish('Победа');const ranked=moves.map(move=>{const capture=Math.abs(move.to[0]-move.from[0])>1?5:0,promotion=move.to[0]===7?3:0,center=3.5-Math.abs(3.5-move.to[1]);return{...move,score:level==='easy'?Math.random():capture+promotion+(level==='expert'?center*.3:0)+Math.random()}}).sort((a,b)=>b.score-a.score);play(ranked[0].from,ranked[0].to,true);if(!over&&position.turn==='c')setTimeout(bot,260)}
  function finish(result){if(over)return;over=true;record(appState,'checkers',result);render();toast(result,result==='Победа'?'+100 очков за стратегию':'Реванш уже ждёт.')}
}
function same(a,b){return a?.[0]===b?.[0]&&a?.[1]===b?.[1]}
