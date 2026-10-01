import {record} from './storage.js?v=7';
import {toast,formatTime,modal} from './ui.js?v=7';
import {createChessState,chessLegalMoves,chessAllMoves,applyChessMove} from './rules.js?v=7';

const glyph={wk:'♔',wq:'♕',wr:'♖',wb:'♗',wn:'♘',wp:'♙',bk:'♚',bq:'♛',br:'♜',bb:'♝',bn:'♞',bp:'♟'};
const value={p:1,n:3,b:3,r:5,q:9,k:100};

export function mountChess(root,appState,level='medium'){
  let position=createChessState(),selected=null,legal=[],history=[],seconds=0,over=false;
  root.innerHTML=layout();const board=root.querySelector('.board'),status=root.querySelector('[data-status]'),list=root.querySelector('.move-list'),timer=root.querySelector('.timer');render();
  const tick=setInterval(()=>{if(!over){seconds++;timer.textContent=formatTime(seconds)}},1000);root._cleanup=()=>clearInterval(tick);
  root.querySelector('[data-resign]').onclick=()=>modal({title:'Сдаться?',text:'Партия будет записана как поражение.',danger:true,confirm:'Сдаться',onConfirm:()=>finish('Поражение')});
  root.querySelector('[data-restart]').onclick=()=>{position=createChessState();selected=null;legal=[];history=[];seconds=0;over=false;render()};

  function layout(){return `<div class="game-layout"><div class="game-panel board-panel"><div class="board chess-board" aria-label="Шахматная доска"></div></div><div class="game-info"><div class="game-panel"><div class="player-row" data-bot><div class="face">🤖</div><span><b>BOT / ${level.toUpperCase()}</b><small>Чёрные</small></span></div><div class="timer">00:00</div><div class="player-row active" data-you><div class="face">${appState.profile.avatar}</div><span><b>${appState.profile.nickname}</b><small>Белые</small></span></div></div><div class="game-panel"><h3 class="panel-title" data-status>Ваш ход</h3><div class="move-list"></div><button class="btn btn-secondary btn-wide" data-restart>Новая партия</button><button class="btn btn-ghost btn-wide" style="margin-top:8px" data-resign>Сдаться</button></div></div>`}
  function render(){
    board.innerHTML='';const checkKing=position.check?findKing(position.board,position.turn):null;
    for(let r=0;r<8;r++)for(let c=0;c<8;c++){
      const square=document.createElement('button'),piece=position.board[r][c];square.className=`square ${(r+c)%2?'dark':'light'}`;square.type='button';square.setAttribute('aria-label',`${String.fromCharCode(97+c)}${8-r}`);
      if(selected?.[0]===r&&selected?.[1]===c)square.classList.add('selected');if(legal.some(x=>same(x,[r,c])))square.classList.add(piece?'capture':'legal');
      if(position.lastMove&&(same(position.lastMove.from,[r,c])||same(position.lastMove.to,[r,c])))square.classList.add('last-move');if(checkKing&&same(checkKing,[r,c]))square.classList.add('in-check');
      if(piece)square.innerHTML=`<span class="chess-piece ${piece[0]==='w'?'piece-white':'piece-black'}">${glyph[piece]}</span>`;square.onclick=()=>click(r,c);board.append(square);
    }
    status.textContent=over?'Партия завершена':position.check?(position.turn==='w'?'Шах вашему королю':'Бот под шахом'):position.turn==='w'?'Ваш ход':'Бот думает…';
    list.innerHTML=history.length?history.map((m,i)=>`${i+1}. ${m}`).join('<br>'):'Ходы появятся здесь.';root.querySelector('[data-you]').classList.toggle('active',position.turn==='w');root.querySelector('[data-bot]').classList.toggle('active',position.turn==='b');
  }
  function click(r,c){
    if(over||position.turn!=='w')return;const piece=position.board[r][c];
    if(selected&&legal.some(x=>same(x,[r,c]))){play(selected,[r,c],false);return}
    if(piece?.[0]==='w'){selected=[r,c];legal=chessLegalMoves(position,r,c)}else{selected=null;legal=[]}render();
  }
  function play(from,to,botMove){
    const moving=position.board[from[0]][from[1]],next=applyChessMove(position,from,to);if(!next)return;position=next;history.push(`${glyph[moving]} ${coord(from)}–${coord(to)}`);selected=null;legal=[];render();
    if(position.result)return finish(position.result.winner==='w'?'Победа':position.result.winner===null?'Ничья':'Поражение');if(!botMove)setTimeout(bot,320);
  }
  function bot(){
    if(over||position.turn!=='b')return;const moves=chessAllMoves(position,'b');if(!moves.length)return finish(position.check?'Победа':'Ничья');
    const ranked=moves.map(move=>{const target=position.board[move.to[0]][move.to[1]],capture=target?value[target[1]]:0,center=3.5-(Math.abs(3.5-move.to[0])+Math.abs(3.5-move.to[1]))/2;return{...move,score:level==='easy'?Math.random():capture*5+center*(level==='expert'?1:.25)+Math.random()*(level==='medium'?3:1)}}).sort((a,b)=>b.score-a.score);play(ranked[0].from,ranked[0].to,true);
  }
  function finish(result){if(over)return;over=true;record(appState,'chess',result);render();toast(result,result==='Победа'?'Отличная партия! +100 очков':result==='Ничья'?'На доске пат.':'Попробуйте другую стратегию.')}
}

function findKing(board,color){for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(board[r][c]===color+'k')return[r,c];return null}
function coord(cell){return `${String.fromCharCode(97+cell[1])}${8-cell[0]}`}function same(a,b){return a?.[0]===b?.[0]&&a?.[1]===b?.[1]}
