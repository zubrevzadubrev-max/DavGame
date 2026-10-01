export const avatars=['🦊','🐺','🐼','🦁','👾','🤖','🧙','🥷'];
export function toast(title,text=''){
 const root=document.querySelector('#toast-root');const node=document.createElement('div');node.className='toast';node.innerHTML=`<b>${title}</b>${text?`<small>${text}</small>`:''}`;root.append(node);setTimeout(()=>node.remove(),3200)
}
export function modal({title,text,confirm='Продолжить',danger=false,onConfirm,onCancel,extra=''}){
 const root=document.querySelector('#modal-root');root.innerHTML=`<div class="modal-backdrop"><div class="modal"><span class="eyebrow">DavGame / подтверждение</span><h2>${title}</h2><p class="muted">${text}</p>${extra}<div class="modal-actions"><button class="btn btn-ghost" data-close>Отмена</button><button class="btn ${danger?'btn-danger':'btn-primary'}" data-confirm>${confirm}</button></div></div></div>`;
 root.querySelector('[data-close]').onclick=()=>{onCancel?.();root.innerHTML=''};root.querySelector('.modal-backdrop').onclick=e=>{if(e.target===e.currentTarget){onCancel?.();root.innerHTML=''}};root.querySelector('[data-confirm]').onclick=()=>{onConfirm?.();root.innerHTML=''}
}
export function formatTime(total){return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`}
export function gameHeader(title,subtitle){return `<div class="page-head"><div><a href="#games" class="back">← К выбору игры</a><h1 class="page-title">${title}</h1><p class="muted">${subtitle}</p></div></div>`}
