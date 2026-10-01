const chessGlyph={wk:'♔',wq:'♕',wr:'♖',wb:'♗',wn:'♘',wp:'♙',bk:'♚',bq:'♛',br:'♜',bb:'♝',bn:'♞',bp:'♟'};

const lessons={
  chess:[
    {title:'Доска и расстановка',tag:'Основа',text:'Шахматная доска состоит из 64 клеток. Белые начинают снизу и всегда делают первый ход. Ферзь стоит на клетке своего цвета.',pieces:initialChess(),marks:[27,28,35,36],question:'Кто делает первый ход?',answers:['Чёрные','Белые','Случайный игрок'],correct:1},
    {title:'Как ходят фигуры',tag:'Движение',text:'Ладья ходит по прямой, слон — по диагонали, ферзь совмещает их ходы. Конь прыгает буквой «Г», а король перемещается на одну клетку.',pieces:{35:'wn'},marks:[18,20,25,29,41,45,50,52],question:'Какая фигура может перепрыгивать через другие?',answers:['Конь','Ладья','Ферзь'],correct:0},
    {title:'Шах и защита',tag:'Безопасность',text:'Шах означает, что король атакован. Нужно уйти королём, закрыться другой фигурой или взять атакующую фигуру. Оставлять своего короля под шахом нельзя.',pieces:{4:'bk',52:'wr',60:'wk'},marks:[4,12,20,28,36,44,52],question:'Можно ли завершить ход, оставив своего короля под шахом?',answers:['Да','Только один раз','Нет'],correct:2},
    {title:'Мат и цель партии',tag:'Финиш',text:'Мат — это шах, от которого нет защиты. Контролируй центр, развивай фигуры и не выводи ферзя слишком рано.',pieces:{0:'bk',10:'wk',9:'wq'},marks:[0,1,8,9,10],question:'Что завершает шахматную партию победой?',answers:['Любой шах','Мат королю','Взятие ферзя'],correct:1}
  ],
  checkers:[
    {title:'Доска и расстановка',tag:'Основа',text:'У каждого игрока по 12 шашек. Они стоят только на тёмных клетках первых трёх рядов. Красные начинают снизу.',pieces:initialCheckers(),marks:[],question:'На каких клетках стоят и ходят шашки?',answers:['Только на тёмных','Только на светлых','На любых'],correct:0},
    {title:'Обычный ход',tag:'Движение',text:'Простая шашка ходит на одну свободную клетку по диагонали вперёд. Ходить прямо или вбок нельзя.',pieces:{42:'r'},marks:[33,35],question:'Как ходит простая шашка без взятия?',answers:['Прямо вперёд','По диагонали вперёд','На любую клетку'],correct:1},
    {title:'Обязательное взятие',tag:'Тактика',text:'Если шашка может побить соперника, обычный ход запрещён. Перепрыгни через чужую шашку на свободную клетку за ней. Бить можно вперёд и назад.',pieces:{42:'r',35:'c'},marks:[28],question:'Что делать, если доступно взятие?',answers:['Можно выбрать любой ход','Взятие обязательно','Пропустить ход'],correct:1},
    {title:'Цепочка и дамка',tag:'Мастерство',text:'После взятия продолжай той же шашкой, если она снова может бить. На последнем ряду шашка становится дамкой и ходит по диагонали на любое расстояние.',pieces:{42:'r',35:'c',21:'c'},marks:[28,14],question:'Когда простая шашка становится дамкой?',answers:['После первого взятия','На последнем ряду','После трёх ходов'],correct:1}
  ]
};

export function mountTutorial(root,game,state,saveState,notify){
  const course=lessons[game];if(!course)return;
  state.learning??={};const stored=state.learning[game]||{},wasCompleted=Boolean(stored.completed);let step=Math.min(stored.step||0,course.length-1),answered=false;
  render();

  function render(){
    const lesson=course[step],progress=wasCompleted?100:Math.round(step/course.length*100);
    root.innerHTML=`<div class="learn-shell"><aside class="learn-index"><span class="eyebrow">Курс / 0${course.length}</span><h2>${game==='chess'?'Шахматы':'Шашки'} с нуля</h2><div class="learn-progress"><i style="width:${progress}%"></i></div><nav>${course.map((item,i)=>`<button class="${i===step?'active':''} ${wasCompleted||i<step?'done':''}" data-step="${i}"><span>0${i+1}</span>${item.title}</button>`).join('')}</nav></aside><section class="learn-card"><div class="learn-copy"><span class="eyebrow">Урок 0${step+1} · ${lesson.tag}</span><h2>${lesson.title}</h2><p>${lesson.text}</p><div class="learn-question"><b>${lesson.question}</b>${lesson.answers.map((answer,i)=>`<button data-answer="${i}">${answer}</button>`).join('')}</div></div>${diagram(lesson,game)}<footer><button class="btn btn-ghost" data-prev ${step===0?'disabled':''}>← Назад</button><button class="btn btn-primary" data-next disabled>${step===course.length-1?'Завершить обучение':'Следующий урок →'}</button></footer></section></div>`;
    root.querySelectorAll('[data-step]').forEach(button=>button.onclick=()=>{const target=+button.dataset.step;if(wasCompleted||target<=step){step=target;answered=false;render()}});
    root.querySelector('[data-prev]').onclick=()=>{if(step){step--;answered=false;render()}};
    root.querySelectorAll('[data-answer]').forEach(button=>button.onclick=()=>answer(button,+button.dataset.answer));
    root.querySelector('[data-next]').onclick=next;
  }

  function answer(button,index){
    const box=button.parentElement;box.querySelectorAll('button').forEach(item=>item.classList.remove('correct','wrong'));
    if(index!==course[step].correct){button.classList.add('wrong');notify('Попробуйте ещё раз','Подсказка находится в тексте урока.');return}
    button.classList.add('correct');answered=true;root.querySelector('[data-next]').disabled=false;
  }
  function next(){
    if(!answered)return;
    if(step<course.length-1){step++;state.learning[game]={step,completed:false};saveState(state);answered=false;render();return}
    state.learning[game]={step:course.length-1,completed:true};if(!wasCompleted)state.stats.points+=50;saveState(state);notify('Курс завершён','Все уроки пройдены. +50 очков мастерства');location.hash=`select/${game}`;
  }
}

function diagram(lesson,game){return `<div class="learn-board ${game==='chess'?'learn-board--chess':'learn-board--checkers'}" aria-label="Учебная позиция">${Array.from({length:64},(_,i)=>{const piece=lesson.pieces[i],marked=lesson.marks.includes(i);let content='';if(piece&&game==='chess')content=`<span class="chess-piece ${piece[0]==='w'?'piece-white':'piece-black'}">${chessGlyph[piece]}</span>`;if(piece&&game==='checkers')content=`<span class="checker ${piece.toLowerCase()==='r'?'red':'cream'} ${piece===piece.toUpperCase()?'king':''}"></span>`;return `<span class="learn-square ${(Math.floor(i/8)+i%8)%2?'dark':'light'} ${marked?'marked':''}">${content}</span>`}).join('')}</div>`}
function initialChess(){const pieces={},back=['r','n','b','q','k','b','n','r'];for(let c=0;c<8;c++){pieces[c]='b'+back[c];pieces[8+c]='bp';pieces[48+c]='wp';pieces[56+c]='w'+back[c]}return pieces}
function initialCheckers(){const pieces={};for(let r=0;r<3;r++)for(let c=0;c<8;c++)if((r+c)%2)pieces[r*8+c]='c';for(let r=5;r<8;r++)for(let c=0;c<8;c++)if((r+c)%2)pieces[r*8+c]='r';return pieces}
