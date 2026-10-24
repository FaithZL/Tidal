// The isolated art-review route never initializes the exercise or camera modules.
const query=new URLSearchParams(location.search);
const loaded=query.get('art')==='character-motion'
 ? query.get('model')==='prototype'?import('./characterSample.js'):import('./userModelSample.js') : import('./browser.js');
void loaded.catch(()=>{
 const message=document.createElement('div');message.setAttribute('role','alert');message.className='modal';
 const text=document.createElement('p');text.textContent='演示启动失败，请检查本地服务并重新加载。';
 const reload=document.createElement('a');reload.textContent='重新加载';reload.href=location.href;reload.className='primary';message.append(text,reload);
 document.body.replaceChildren(message);document.body.inert=false;document.body.dataset.boot='failed';
});
