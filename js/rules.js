const CHESS_BACK=['r','n','b','q','k','b','n','r'];

export function createChessState(){
  const board=Array.from({length:8},()=>Array(8).fill(null));
  for(let c=0;c<8;c++){board[0][c]='b'+CHESS_BACK[c];board[1][c]='bp';board[6][c]='wp';board[7][c]='w'+CHESS_BACK[c]}
  return {revision:0,board,turn:'w',castling:{wK:true,wQ:true,bK:true,bQ:true},enPassant:null,lastMove:null,check:false,result:null};
}

export function chessLegalMoves(state,r,c){
  const piece=state.board[r]?.[c];if(!piece)return[];const color=piece[0];
  return chessPseudo(state,r,c).filter(([tr,tc])=>{
    if(state.board[tr][tc]?.[1]==='k')return false;
    const next=applyChessRaw(state,[r,c],[tr,tc]);return !isChessCheck(next,color);
  });
}

export function chessAllMoves(state,color=state.turn){
  const out=[];for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(state.board[r][c]?.[0]===color)for(const to of chessLegalMoves(state,r,c))out.push({from:[r,c],to});return out;
}

export function applyChessMove(state,from,to,promotion='q'){
  const piece=state.board[from[0]]?.[from[1]];if(!piece||piece[0]!==state.turn)return null;
  if(!chessLegalMoves(state,from[0],from[1]).some(x=>sameCell(x,to)))return null;
  const next=applyChessRaw(state,from,to,promotion),enemy=otherColor(piece[0]);next.turn=enemy;next.revision=(state.revision||0)+1;next.lastMove={from,to,piece};next.check=isChessCheck(next,enemy);
  const replies=chessAllMoves(next,enemy);if(!replies.length)next.result=next.check?{winner:piece[0],reason:'checkmate'}:{winner:null,reason:'stalemate'};return next;
}

export function isChessCheck(state,color){
  let king=null;for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(state.board[r][c]===color+'k')king=[r,c];return !king||isSquareAttacked(state.board,king[0],king[1],otherColor(color));
}

function chessPseudo(state,r,c){
  const board=state.board,piece=board[r]?.[c];if(!piece)return[];const color=piece[0],type=piece[1],out=[];
  const add=(rr,cc)=>{if(!inside(rr,cc))return false;const target=board[rr][cc];if(!target){out.push([rr,cc]);return true}if(target[0]!==color)out.push([rr,cc]);return false};
  const ray=(dr,dc)=>{let rr=r+dr,cc=c+dc;while(add(rr,cc)){rr+=dr;cc+=dc}};
  if(type==='p'){
    const d=color==='w'?-1:1,start=color==='w'?6:1;
    if(inside(r+d,c)&&!board[r+d][c]){out.push([r+d,c]);if(r===start&&!board[r+2*d][c])out.push([r+2*d,c])}
    for(const dc of[-1,1]){const rr=r+d,cc=c+dc,target=board[rr]?.[cc];if(target&&target[0]!==color)out.push([rr,cc]);else if(state.enPassant&&sameCell(state.enPassant,[rr,cc]))out.push([rr,cc])}
  }
  if(type==='n')for(const[dr,dc]of[[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]])add(r+dr,c+dc);
  if('brq'.includes(type)){if(type!=='b'){ray(1,0);ray(-1,0);ray(0,1);ray(0,-1)}if(type!=='r'){ray(1,1);ray(1,-1);ray(-1,1);ray(-1,-1)}}
  if(type==='k'){
    for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)if(dr||dc)add(r+dr,c+dc);
    const home=color==='w'?7:0,enemy=otherColor(color);
    if(r===home&&c===4&&!isSquareAttacked(board,home,4,enemy)){
      if(state.castling?.[color+'K']&&!board[home][5]&&!board[home][6]&&board[home][7]===color+'r'&&!isSquareAttacked(board,home,5,enemy)&&!isSquareAttacked(board,home,6,enemy))out.push([home,6]);
      if(state.castling?.[color+'Q']&&!board[home][1]&&!board[home][2]&&!board[home][3]&&board[home][0]===color+'r'&&!isSquareAttacked(board,home,3,enemy)&&!isSquareAttacked(board,home,2,enemy))out.push([home,2]);
    }
  }
  return out;
}

function applyChessRaw(state,from,to,promotion='q'){
  const next={...state,board:state.board.map(row=>[...row]),castling:{...state.castling},enPassant:null,result:null},piece=next.board[from[0]][from[1]],captured=next.board[to[0]][to[1]];
  next.board[to[0]][to[1]]=piece;next.board[from[0]][from[1]]=null;
  if(piece[1]==='p'&&state.enPassant&&sameCell(state.enPassant,to)&&!captured)next.board[from[0]][to[1]]=null;
  if(piece[1]==='p'&&Math.abs(to[0]-from[0])===2)next.enPassant=[(to[0]+from[0])/2,from[1]];
  if(piece[1]==='p'&&(to[0]===0||to[0]===7))next.board[to[0]][to[1]]=piece[0]+(['q','r','b','n'].includes(promotion)?promotion:'q');
  if(piece[1]==='k'&&Math.abs(to[1]-from[1])===2){const rookFrom=to[1]===6?7:0,rookTo=to[1]===6?5:3;next.board[to[0]][rookTo]=next.board[to[0]][rookFrom];next.board[to[0]][rookFrom]=null}
  updateCastling(next.castling,piece,from,captured,to);return next;
}

function updateCastling(rights,piece,from,captured,to){const color=piece[0],home=color==='w'?7:0;if(piece[1]==='k'){rights[color+'K']=false;rights[color+'Q']=false}if(piece[1]==='r'&&from[0]===home){if(from[1]===0)rights[color+'Q']=false;if(from[1]===7)rights[color+'K']=false}if(captured?.[1]==='r'){const enemy=captured[0],enemyHome=enemy==='w'?7:0;if(to[0]===enemyHome&&to[1]===0)rights[enemy+'Q']=false;if(to[0]===enemyHome&&to[1]===7)rights[enemy+'K']=false}}

function isSquareAttacked(board,r,c,by){
  const pawnRow=r+(by==='w'?1:-1);for(const dc of[-1,1])if(board[pawnRow]?.[c+dc]===by+'p')return true;
  for(const[dr,dc]of[[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]])if(board[r+dr]?.[c+dc]===by+'n')return true;
  for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)if((dr||dc)&&board[r+dr]?.[c+dc]===by+'k')return true;
  for(const[dr,dc,types]of[[1,0,'rq'],[-1,0,'rq'],[0,1,'rq'],[0,-1,'rq'],[1,1,'bq'],[1,-1,'bq'],[-1,1,'bq'],[-1,-1,'bq']]){let rr=r+dr,cc=c+dc;while(inside(rr,cc)){const p=board[rr][cc];if(p){if(p[0]===by&&types.includes(p[1]))return true;break}rr+=dr;cc+=dc}}
  return false;
}

export function createCheckersState(){
  const board=Array.from({length:8},()=>Array(8).fill(null));for(let r=0;r<3;r++)for(let c=0;c<8;c++)if((r+c)%2===1)board[r][c]='c';for(let r=5;r<8;r++)for(let c=0;c<8;c++)if((r+c)%2===1)board[r][c]='r';return {revision:0,board,turn:'r',forced:null,lastMove:null,result:null};
}

export function checkersLegalMoves(state,r,c){
  const piece=state.board[r]?.[c];if(!piece||piece.toLowerCase()!==state.turn)return[];if(state.forced&&!sameCell(state.forced,[r,c]))return[];
  const captures=checkerCaptures(state.board,r,c);if(captures.length)return captures;if(hasCheckersCapture(state,state.turn))return[];return checkerSteps(state.board,r,c);
}

export function checkersAllMoves(state,color=state.turn){const view={...state,turn:color,forced:color===state.turn?state.forced:null},out=[];for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(view.board[r][c]?.toLowerCase()===color)for(const to of checkersLegalMoves(view,r,c))out.push({from:[r,c],to});return out}

export function applyCheckersMove(state,from,to){
  const piece=state.board[from[0]]?.[from[1]];if(!piece||piece.toLowerCase()!==state.turn||!checkersLegalMoves(state,from[0],from[1]).some(x=>sameCell(x,to)))return null;
  const board=state.board.map(row=>[...row]),captured=findCaptured(board,from,to);board[to[0]][to[1]]=piece;board[from[0]][from[1]]=null;if(captured)board[captured[0]][captured[1]]=null;
  const color=piece.toLowerCase();if((color==='r'&&to[0]===0)||(color==='c'&&to[0]===7))board[to[0]][to[1]]=piece.toUpperCase();
  const next={...state,revision:(state.revision||0)+1,board,lastMove:{from,to,captured},forced:null,result:null};
  if(captured&&checkerCaptures(board,to[0],to[1]).length){next.forced=to;next.turn=color;return next}
  const enemy=color==='r'?'c':'r';next.turn=enemy;const enemyPieces=board.flat().some(x=>x?.toLowerCase()===enemy);if(!enemyPieces||!checkersAllMoves(next,enemy).length)next.result={winner:color,reason:'capture'};return next;
}

export function hasCheckersCapture(state,color){for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(state.board[r][c]?.toLowerCase()===color&&checkerCaptures(state.board,r,c).length)return true;return false}

function checkerSteps(board,r,c){const piece=board[r][c],color=piece.toLowerCase(),king=piece===piece.toUpperCase(),out=[],dirs=king?[[1,1],[1,-1],[-1,1],[-1,-1]]:(color==='r'?[[-1,1],[-1,-1]]:[[1,1],[1,-1]]);for(const[dr,dc]of dirs){let rr=r+dr,cc=c+dc;while(inside(rr,cc)&&!board[rr][cc]){out.push([rr,cc]);if(!king)break;rr+=dr;cc+=dc}}return out}

function checkerCaptures(board,r,c){const piece=board[r]?.[c];if(!piece)return[];const color=piece.toLowerCase(),king=piece===piece.toUpperCase(),out=[];for(const[dr,dc]of[[1,1],[1,-1],[-1,1],[-1,-1]]){let rr=r+dr,cc=c+dc,enemySeen=false;while(inside(rr,cc)){const target=board[rr][cc];if(!target){if(enemySeen){out.push([rr,cc]);if(!king)break}else if(!king)break;rr+=dr;cc+=dc;continue}if(target.toLowerCase()===color||enemySeen)break;enemySeen=true;rr+=dr;cc+=dc}}return out}

function findCaptured(board,from,to){const dr=Math.sign(to[0]-from[0]),dc=Math.sign(to[1]-from[1]);let r=from[0]+dr,c=from[1]+dc;while(r!==to[0]&&c!==to[1]){if(board[r][c])return[r,c];r+=dr;c+=dc}return null}
function inside(r,c){return r>=0&&r<8&&c>=0&&c<8}function sameCell(a,b){return a?.[0]===b?.[0]&&a?.[1]===b?.[1]}function otherColor(color){return color==='w'?'b':'w'}
