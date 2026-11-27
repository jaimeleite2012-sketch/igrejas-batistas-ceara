/* Private ASSIBRECE registry. Personal records never ship in static source. */
(() => {
'use strict';
const root=document.getElementById('assibrece');
const BASE='https://pltpqhboxughkpybixcb.supabase.co';
const KEY='sb_publishable_CHpRWYjYhDpEDnzHr7c1Aw_a3mgyJKF';
const APP='https://jaimeleite2012-sketch.github.io/igrejas-batistas-ceara/index.html?aba=assibrece';
const FIELD=[['name','Nome completo',200],['phone','Telefone / WhatsApp',40],['role_description','Cargo / Descrição no grupo',300],['church','Igreja / Congregação',300],['email','E-mail',254],['city_neighborhood','Cidade / Bairro',300],['profession','Profissão / Ofício / Área de atuação',500],['service_description','Serviços que está apto a prestar',1000],['notes','Observações',2000]];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const el=id=>document.getElementById('as-'+id);
let session=null,user=null,isAdmin=false,personalKey=sessionStorage.getItem('assibrece-key')||'',rows=[],page=0,total=0,filter='',editing=null,sequence=0;
if(!localStorage.getItem('assibrece-auth')&&sessionStorage.getItem('assibrece-auth'))localStorage.setItem('assibrece-auth',sessionStorage.getItem('assibrece-auth'));
try{session=JSON.parse(localStorage.getItem('assibrece-auth')||'null');}catch{}
const hash=new URLSearchParams(location.hash.slice(1));
if(hash.has('assibrece_key')){
 personalKey=hash.get('assibrece_key');sessionStorage.setItem('assibrece-key',personalKey);
 history.replaceState(null,'',location.pathname+'?aba=assibrece');
}
root.innerHTML=`<div class="dash-hero"><h2>ASSIBRECE</h2><p>Cadastro dos irmãos · Comunhão e cooperação</p></div>
<div class="as-toolbar"><button class="btn primary" id="as-manage">Entrar como administrador</button><span id="as-session">Consulta pública · edição protegida</span><button class="btn" id="as-refresh">Atualizar</button><button class="btn" id="as-logout" hidden>Sair</button></div>
<p id="as-message" class="as-message" role="status" aria-live="polite"></p>
<div id="as-login" class="as-panel" hidden><h3>Acesse e atualize seu cadastro</h3><p>Cada irmão pode editar somente a própria ficha. Entre com seu e-mail ou use o link pessoal recebido pelo WhatsApp.</p><details id="as-email-access"><summary>Entrar pelo e-mail para editar meus dados</summary><form id="as-login-form" class="as-form"><label>E-mail de acesso<input name="email" type="email" autocomplete="email" required maxlength="254"></label><button class="btn primary">Receber link por e-mail</button></form><p>No primeiro acesso por e-mail, o administrador precisa vincular sua conta à ficha correta.</p><p><b>Depois de entrar, você continuará conectado neste aparelho até clicar em Sair.</b></p></details><button class="btn" id="as-admin-login">Entrar como administrador</button></div>
<div id="as-request" class="as-panel" hidden><h3>Solicitar acesso ao meu cadastro</h3><p>Informe seus dados para o administrador localizar sua ficha. Se ainda não houver cadastro, ele poderá criar um.</p><form id="as-request-form" class="as-form"><label>Nome completo<input name="name" required minlength="2" maxlength="200" autocomplete="name"></label><label>Telefone / WhatsApp<input name="phone" required minlength="8" maxlength="40" type="tel" autocomplete="tel"></label><label>Igreja / Congregação<input name="church" maxlength="300"></label><button class="btn primary">Solicitar acesso</button></form><p id="as-request-status"></p></div>
<div id="as-admin" hidden><div class="as-kpis"><article class="kpi"><b id="as-total">—</b><span>Cadastros no resultado</span></article><article class="kpi"><b>2.000+</b><span>Preparado para crescer</span></article><article class="kpi"><b id="as-pending">—</b><span>Solicitações pendentes</span></article></div><div class="as-toolbar"><label class="as-search">Buscar por nome, telefone, igreja ou cidade<input id="as-search" type="search" placeholder="Digite para buscar…"></label><button class="btn primary" id="as-new">Novo cadastro</button></div><details class="as-panel"><summary>Solicitações de acesso por e-mail</summary><div id="as-requests"></div></details></div>
<div id="as-list" class="as-list"></div><div id="as-pagination" class="as-toolbar" hidden><button class="btn" id="as-prev">Anterior</button><span id="as-page"></span><button class="btn" id="as-next">Próxima</button></div>
<dialog id="as-editor" class="as-dialog"><form id="as-editor-form" class="as-form"><h3 id="as-editor-title">Cadastro</h3><section class="as-photo-editor"><div class="as-photo-preview-wrap"><img id="as-profile-preview" alt="Foto de perfil ou do negócio" hidden><span id="as-profile-placeholder">Sem foto</span></div><div><label>Foto de perfil ou do negócio<input id="as-profile-photo" type="file" accept="image/jpeg,image/png,image/webp"></label><p class="as-note">A imagem será ajustada automaticamente. Use JPG, PNG ou WebP.</p><button class="btn" id="as-remove-profile-photo" type="button">Remover foto atual</button></div></section><label>Vincular à igreja do cadastro geral<select id="as-church-link"><option value="">Selecionar igreja</option></select></label>${FIELD.map(([k,l,max])=>`<label>${l}${k==='notes'||k==='service_description'?`<textarea name="${k}" maxlength="${max}" rows="3"></textarea>`:`<input name="${k}" maxlength="${max}" ${k==='name'?'required':''} type="${k==='email'?'email':k==='phone'?'tel':'text'}">`}</label>`).join('')}<label class="as-check"><input id="as-offers-services" name="offers_services" type="checkbox"> Está apto e disponível para prestar esse serviço quando contratado pelos irmãos</label><p id="as-save-message" role="status"></p><div class="as-toolbar"><button type="button" class="btn" id="as-cancel">Cancelar</button><button class="btn primary" id="as-save">Salvar cadastro</button></div></form></dialog>
<dialog id="as-share" class="as-dialog"><h3>Link pessoal do membro</h3><p id="as-share-name"></p><p>Este link permite editar somente esta ficha e vale por 30 dias. Envie apenas ao titular, em conversa privada. Gerar outro link invalida o anterior.</p><label>Link individual<input id="as-share-url" readonly></label><div class="as-toolbar"><button class="btn" id="as-copy">Copiar link</button><a class="btn as-wa" id="as-whatsapp" target="_blank" rel="noopener noreferrer">Abrir WhatsApp</a><button class="btn" id="as-share-close">Fechar</button></div><p id="as-share-message" role="status"></p></dialog>`;

const directory=document.createElement('section');
directory.className='as-panel';
directory.innerHTML=`<h3>Contatos e mensagens da ASSIBRECE</h3>
<p>Consulte os irmãos e use os filtros para preparar mensagens. O WhatsApp abrirá uma conversa por vez para você confirmar o envio.</p>
<section class="as-message-center" aria-labelledby="as-message-center-title">
 <div class="as-compose-head"><div><h4 id="as-message-center-title">Central de mensagens no WhatsApp</h4><p>Escolha o público, as igrejas e os destinatários. Somente contatos com WhatsApp válido poderão ser selecionados.</p></div><strong id="as-recipient-count">0 selecionados</strong></div>
 <div class="as-filter-grid">
  <label>Buscar irmão, igreja, profissão ou atividade<input id="as-public-search" type="search" placeholder="Nome, igreja, profissão, produto ou serviço…"></label>
  <label>Tipo de contato<select id="as-contact-type"><option value="all">Todos os irmãos</option><option value="pastors">Somente pastores</option><option value="services">Prestadores de serviço</option><option value="sellers">Vendedores / produtos</option></select></label>
  <details class="as-church-filter"><summary id="as-church-filter-summary">Todas as igrejas</summary><div class="as-church-filter-tools"><button class="btn" id="as-all-churches" type="button">Todas</button><button class="btn" id="as-clear-churches" type="button">Limpar</button></div><div id="as-church-choices" class="as-church-choices"></div></details>
 </div>
 <div class="as-filter-actions"><button class="btn primary" id="as-select-filtered" type="button">Selecionar contatos filtrados</button><button class="btn" id="as-clear-recipients" type="button">Limpar seleção</button><span id="as-filtered-count">0 contatos no filtro</span></div>
 <div id="as-recipient-list" class="as-recipient-list"></div>
 <label class="as-message-label">Mensagem<textarea id="as-campaign-message" rows="5" maxlength="4000" placeholder="Digite a mensagem geral. Você pode usar {nome} e {igreja}."></textarea></label>
 <div class="as-filter-actions"><button class="btn primary" id="as-prepare-campaign" type="button">Preparar envios no WhatsApp</button><button class="btn" id="as-copy-campaign" type="button">Copiar mensagem</button></div>
 <p id="as-campaign-status" class="as-note" role="status">O app não dispara mensagens automaticamente: cada conversa será aberta para sua confirmação.</p>
 <section id="as-campaign-queue" class="as-campaign-queue" hidden><div class="as-compose-head"><div><h4>Fila de envio</h4><p id="as-queue-summary"></p></div><strong id="as-queue-progress">0%</strong></div><p id="as-queue-current"></p><div class="as-filter-actions"><button class="btn primary" id="as-open-next" type="button">Abrir próximo contato</button><button class="btn" id="as-mark-sent" type="button">Marcar como enviado</button><button class="btn" id="as-skip-contact" type="button">Pular contato</button><button class="btn" id="as-end-campaign" type="button">Encerrar fila</button></div></section>
</section>
<p id="as-public-count" role="status"></p><div id="as-public-groups"></div>
<dialog id="as-contact" class="as-dialog" aria-labelledby="as-contact-title"><div id="as-contact-body"></div><button class="btn" id="as-contact-close">Fechar</button></dialog>`;
root.querySelector('#as-message').after(directory);
let contacts=[],marketListings=[],selectedRecipientIds=new Set(),selectedChurchIds=new Set(),photoRemoval=false;
const AS_CAMPAIGN_KEY='assibrece_whatsapp_queue_v1';
const normalize=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/\s+/g,' ');
const personKey=v=>normalize(v).replace(/^(pr\.?|pra\.?|pastor(?:a)?|irmao|irma)\s+/,'');
const pastor=x=>/\b(pastor|pastora|pr|pra)\b/.test(normalize(x.role_description+' '+x.name));
let churchGroups=[],selectedGroup=null;
const validPhone=v=>{let n=String(v||'').replace(/\D/g,'');return /^(?:\d{10,11}|55\d{10,11})$/.test(n);};
function missingMember(x){return [['name','Nome'],['church','Igreja'],['role_description','Cargo']].filter(([k])=>!normalize(x[k])||String(x[k]).includes('...')).map(([,label])=>label).concat(validPhone(x.phone)?[]:['Telefone / WhatsApp']);}
function groupStatus(g){
 const c=g.church,missing=c?[['name','Nome da igreja'],['city','Cidade'],['address','Endereço'],['pastor','Pastor']].filter(([k])=>!normalize(c[k])).map(([,label])=>label):[];
 if(c&&!validPhone(c.whatsapp))missing.push('WhatsApp da igreja');
 let absent=missing.length,fields=c?5:0;
 g.members.forEach(x=>{absent+=missingMember(x).length;fields+=4;});
 if(!g.members.length){missing.push('Nenhum irmão vinculado');absent++;fields++;}
 const percent=fields?Math.round((fields-absent)*100/fields):0;
 const hasRepresentative=g.members.some(x=>normalize(x.name));
 return {percent,missing,color:hasRepresentative&&absent===0?'green':hasRepresentative?'yellow':'red',label:hasRepresentative&&absent===0?'Cadastro completo':hasRepresentative?'Cadastro iniciado':'Sem representante cadastrado'};
}

const phoneDigits=v=>String(v||'').replace(/\D/g,'').replace(/^55(?=\d{10,11}$)/,'');
function marketFor(x){
 const key=personKey(x.name),phone=phoneDigits(x.phone);
 return marketListings.filter(item=>personKey(item.owner_name)===key||(phone&&phoneDigits(item.whatsapp)===phone));
}
function serviceProvider(x){return !!x.offers_services||marketFor(x).some(item=>normalize(item.type).includes('servico'));}
function seller(x){return marketFor(x).some(item=>/produto|venda|comercio|loja/.test(normalize(item.type+' '+item.category)));}
function directoryChurches(){return typeof churches==='undefined'?[]:churches.map(c=>typeof full==='function'?full(c):c);}
function contactMatchesType(x,type){
 if(type==='pastors')return pastor(x);
 if(type==='services')return serviceProvider(x);
 if(type==='sellers')return seller(x);
 return true;
}
function filteredContacts(){
 const term=normalize(el('public-search').value),type=el('contact-type').value,base=directoryChurches();
 const selectedNames=new Set(base.filter(c=>selectedChurchIds.has(c.id)).map(c=>normalize(c.name)));
 return contacts.filter(x=>{
  const listings=marketFor(x);
  const inChurch=!selectedChurchIds.size||selectedChurchIds.has(x.church_id)||selectedNames.has(normalize(x.church));
  const haystack=normalize([x.name,x.church,x.role_description,x.phone,x.profession,x.service_description,...listings.flatMap(v=>[v.title,v.type,v.category,v.description])].join(' '));
  return inChurch&&contactMatchesType(x,type)&&(!term||haystack.includes(term));
 });
}
function renderChurchChoices(base){
 const box=el('church-choices');if(!box)return;
 box.innerHTML=base.map(c=>'<label><input class="as-church-choice" type="checkbox" value="'+esc(c.id)+'" '+(selectedChurchIds.has(c.id)?'checked':'')+'> <span>'+esc(c.name)+'</span><small>'+esc(c.city||c.region||'Cidade não informada')+'</small></label>').join('');
 const count=selectedChurchIds.size;
 el('church-filter-summary').textContent=!count?'Todas as igrejas':count+' igreja'+(count===1?'':'s')+' selecionada'+(count===1?'':'s');
}
function memberAvatar(x,large=false){
 return x.profile_photo_url?'<img class="as-member-avatar '+(large?'large':'')+'" src="'+esc(x.profile_photo_url)+'" alt="Foto de '+esc(x.name||'irmão')+'" loading="lazy">':'<span class="as-member-avatar as-avatar-empty '+(large?'large':'')+'" aria-hidden="true">'+esc((x.name||'?').trim().charAt(0).toUpperCase())+'</span>';
}
function renderRecipientList(list){
 const box=el('recipient-list');if(!box)return;
 box.innerHTML=list.length?list.map(x=>{
  const listings=marketFor(x),bad=!validPhone(x.phone),checked=selectedRecipientIds.has(x.id);
  const badges=(pastor(x)?'<span>Pastor</span>':'')+(serviceProvider(x)?'<span>Prestador de serviço</span>':'')+(seller(x)?'<span>Vendedor / produto</span>':'');
  return '<article class="as-recipient-card '+(bad?'invalid':'')+'"><label class="as-recipient-check"><input type="checkbox" data-recipient="'+esc(x.id)+'" '+(checked?'checked':'')+' '+(bad?'disabled':'')+'><span class="sr-only">Selecionar '+esc(x.name)+'</span></label>'+memberAvatar(x)+'<button type="button" data-contact="'+esc(x.id)+'"><strong>'+esc(x.name||'Nome não informado')+'</strong><small>'+esc(x.church||'Igreja não informada')+'</small><small>'+esc(x.profession||x.role_description||'Atividade não informada')+'</small><span class="as-recipient-badges">'+badges+(bad?'<span>WhatsApp incompleto</span>':'')+'</span></button></article>';
 }).join(''):'<p class="as-note">Nenhum irmão encontrado com estes filtros.</p>';
 el('filtered-count').textContent=list.length+' contato'+(list.length===1?'':'s')+' no filtro';
 el('recipient-count').textContent=selectedRecipientIds.size+' selecionado'+(selectedRecipientIds.size===1?'':'s');
}
function renderDirectory(){
 const term=normalize(el('public-search').value),type=el('contact-type').value;
 const base=directoryChurches();
 churchGroups=base.map(c=>({label:c.name,church:c,members:[]}));
 const names=new Map();churchGroups.forEach(g=>{const key=normalize(g.label);if(!names.has(key))names.set(key,[]);names.get(key).push(g);});
 const unassigned=[];
 contacts.forEach(x=>{const linked=x.church_id?churchGroups.find(g=>g.church.id===x.church_id&&normalize(g.label)===normalize(x.church)):null;const matches=names.get(normalize(x.church));if(linked)linked.members.push(x);else if(matches?.length===1)matches[0].members.push(x);else unassigned.push(x);});
 const totals={green:0,yellow:0,red:0};churchGroups.forEach(g=>{g.status=groupStatus(g);totals[g.status.color]++;});
 const filtered=filteredContacts(),allowed=new Set(filtered.map(x=>x.id));
 renderChurchChoices(base);renderRecipientList(filtered);
 el('public-count').textContent=base.length+' igrejas · '+contacts.length+' irmãos · '+totals.green+' completas · '+totals.yellow+' com cadastro iniciado · '+totals.red+' sem representante · '+filtered.length+' contatos no filtro';
 const selectedNames=new Set(base.filter(c=>selectedChurchIds.has(c.id)).map(c=>normalize(c.name)));
 const visibleGroups=churchGroups.map((g,i)=>({g,i})).filter(({g})=>{
  const churchSelected=!selectedChurchIds.size||selectedChurchIds.has(g.church.id)||selectedNames.has(normalize(g.label));
  const churchTerm=normalize(g.label+' '+(g.church.city||'')+' '+(g.church.region||'')).includes(term);
  const memberMatch=g.members.some(x=>allowed.has(x.id));
  return churchSelected&&(type==='all'?(!term||churchTerm||memberMatch):memberMatch);
 });
 el('public-groups').innerHTML='<div class="as-legend"><span class="as-green">Verde: cadastro completo</span><span class="as-yellow">Amarelo: possui representante; faltam dados</span><span class="as-red">Vermelho: sem representante cadastrado</span></div><p class="as-note">O vermelho é usado somente quando não há nenhum irmão vinculado. A profissão e a disponibilidade para serviços são informações complementares e não reduzem o status da igreja. Toque em uma caixa para consultar ou editar.</p><div class="as-heatmap">'+visibleGroups.map(({g,i})=>'<button class="as-tile as-'+g.status.color+'" data-group="'+i+'"><strong>'+esc(g.label)+'</strong><span>'+esc(g.church.city||'Cidade não informada')+'</span><b>'+g.members.length+' irmãos · '+g.status.percent+'%</b><span>'+g.status.label+'</span></button>').join('')+'</div>';
 if(unassigned.length){const list=unassigned.filter(x=>allowed.has(x.id));if(list.length)el('public-groups').innerHTML+='<details class="as-church"><summary>Vínculo de igreja a revisar · '+list.length+' irmãos</summary><p>Nomes abreviados ou sem correspondência única precisam ser associados à igreja correta pelo administrador.</p><div class="as-contact-grid">'+list.map(contactCard).join('')+'</div></details>';}
 const field=el('editor-form').elements.church;field.setAttribute('list','as-church-options');
 let options=el('church-options');if(!options){options=document.createElement('datalist');options.id='as-church-options';root.append(options);}const link=el('church-link'),selected=link.value;link.innerHTML='<option value="">Selecionar igreja</option>'+base.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.name+' · '+(c.city||'Cidade não informada')+(c.address?' · '+c.address:''))+'</option>').join('');link.value=selected;options.innerHTML=base.map(c=>'<option value="'+esc(c.name)+'"></option>').join('');
 campaignRender();
}
function contactCard(x){
 return '<button type="button" class="as-contact-card" data-contact="'+esc(x.id)+'">'+memberAvatar(x)+'<strong>'+esc(x.name||'Nome não informado')+'</strong><span>'+esc(x.role_description||'Cargo não informado')+'</span><span>'+esc(x.phone||'Telefone não informado')+'</span>'+(x.profession?'<span>Profissão: '+esc(x.profession)+'</span>':'')+(serviceProvider(x)?'<small>Disponível para prestar serviços</small>':seller(x)?'<small>Vendedor / produto cadastrado</small>':'<small>'+esc(missingMember(x).length?'Falta: '+missingMember(x).join(', '):'Cadastro completo')+'</small>')+'</button>';
}

function campaignLoad(){try{return JSON.parse(localStorage.getItem(AS_CAMPAIGN_KEY)||'null');}catch{return null;}}
function campaignSave(queue){if(queue)localStorage.setItem(AS_CAMPAIGN_KEY,JSON.stringify(queue));else localStorage.removeItem(AS_CAMPAIGN_KEY);}
function campaignMessageFor(message,item){
 return message.replace(/\{nome\}/gi,item.name||'irmão').replace(/\{igreja\}/gi,item.church||'sua igreja');
}
function campaignRender(){
 const queue=campaignLoad(),panel=el('campaign-queue');if(!panel)return;
 if(!queue?.items?.length){panel.hidden=true;return;}
 panel.hidden=false;
 const sent=queue.items.filter(x=>x.status==='sent').length,skipped=queue.items.filter(x=>x.status==='skipped').length,total=queue.items.length,done=sent+skipped;
 const current=queue.items.find(x=>x.status==='opened')||queue.items.find(x=>x.status==='pending');
 el('queue-summary').textContent=done+' de '+total+' processados · '+sent+' enviados · '+skipped+' pulados';
 el('queue-progress').textContent=Math.round(done/total*100)+'%';
 el('queue-current').textContent=current?'Contato atual: '+current.name+' · '+current.church:'Fila concluída.';
 el('open-next').disabled=!current;el('mark-sent').disabled=!current;el('skip-contact').disabled=!current;
}
function prepareCampaign(){
 const messageText=el('campaign-message').value.trim();
 if(!messageText){el('campaign-status').textContent='Escreva a mensagem antes de preparar os envios.';return;}
 const seen=new Set(),items=contacts.filter(x=>selectedRecipientIds.has(x.id)&&validPhone(x.phone)).map(x=>{
  let phone=String(x.phone||'').replace(/\D/g,'');if(phone.length===10||phone.length===11)phone='55'+phone;
  return {id:x.id,name:x.name||'Irmão',church:x.church||'',phone,status:'pending'};
 }).filter(x=>x.phone&&!seen.has(x.phone)&&seen.add(x.phone));
 if(!items.length){el('campaign-status').textContent='Selecione pelo menos um contato com WhatsApp válido.';return;}
 campaignSave({message:messageText,created_at:new Date().toISOString(),items});
 el('campaign-status').textContent='Fila preparada com '+items.length+' contato'+(items.length===1?'':'s')+'. Abra uma conversa por vez.';
 campaignRender();
}
function openNextCampaign(){
 const queue=campaignLoad();if(!queue)return;
 let item=queue.items.find(x=>x.status==='opened')||queue.items.find(x=>x.status==='pending');if(!item)return;
 item.status='opened';item.opened_at=new Date().toISOString();campaignSave(queue);campaignRender();
 const messageText=campaignMessageFor(queue.message,item);
 window.open('https://api.whatsapp.com/send?phone='+item.phone+'&text='+encodeURIComponent(messageText),'_blank','noopener');
}
function markCampaign(status){
 const queue=campaignLoad();if(!queue)return;
 const item=queue.items.find(x=>x.status==='opened')||queue.items.find(x=>x.status==='pending');if(!item)return;
 item.status=status;item.updated_at=new Date().toISOString();campaignSave(queue);campaignRender();
}
function publicWebUrl(value){
 if(!value)return '';
 try{const url=new URL(String(value),location.href);return /^https?:$/.test(url.protocol)?url.href:'';}catch{return '';}
}
function churchProfile(church){
 const c=church||{},address=c.address||('Região '+(c.region||'não informada')+' — endereço ainda não informado');
 const mapUrl=typeof maps==='function'?maps(c):'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent((c.name||'Igreja')+', '+address);
 const earthUrl=typeof earth==='function'?earth(c):'https://earth.google.com/web/search/'+encodeURIComponent(address||c.name||'Ceará');
 const photos=[c.facade,c.extraPhoto].filter(Boolean).map((src,index)=>'<img src="'+esc(src)+'" alt="'+(index?'Foto complementar de ':'Fachada de ')+esc(c.name||'igreja')+'" loading="lazy">').join('');
 let phone=String(c.whatsapp||'').replace(/\D/g,'');if(phone.length===10||phone.length===11)phone='55'+phone;
 const social=[['Instagram',c.instagram],['Facebook',c.facebook],['YouTube',c.youtube],['Site',c.website],['Site / rede oficial',c.site]].map(([label,url])=>[label,publicWebUrl(url)]).filter(([,url],index,all)=>url&&all.findIndex(x=>x[1]===url)===index);
 const socialHtml=social.map(([label,url])=>'<a class="as-profile-link" href="'+esc(url)+'" target="_blank" rel="noopener">'+esc(label)+'</a>').join('')+(phone?'<a class="as-profile-link as-profile-wa" href="https://api.whatsapp.com/send?phone='+esc(phone)+'" target="_blank" rel="noopener">WhatsApp</a>':'');
 return '<section class="as-church-profile" aria-label="Informações da igreja">'+
  '<p class="as-profile-tag">'+esc(c.association||'AIBRECE')+' · '+esc(c.region||'Região não informada')+'</p>'+
  '<p class="as-profile-address"><b>Endereço:</b> '+esc(address)+'</p>'+
  (photos?'<div class="as-profile-photos">'+photos+'</div>':'<p class="as-profile-note">Foto da fachada ainda não cadastrada.</p>')+
  '<div class="as-profile-details">'+
   (c.pastor?'<p><b>Pastor responsável</b><span>'+esc(c.pastor)+'</span></p>':'<p><b>Pastor responsável</b><span>Não informado</span></p>')+
   (c.whatsapp?'<p><b>Contato / WhatsApp</b><span>'+esc(c.whatsapp)+'</span></p>':'<p><b>Contato / WhatsApp</b><span>Não informado</span></p>')+
   (c.city?'<p><b>Cidade</b><span>'+esc(c.city)+'</span></p>':'')+
  '</div>'+
  (socialHtml?'<div class="as-profile-links" aria-label="Links da igreja">'+socialHtml+'</div>':'')+
  '<div class="as-profile-actions">'+
   '<a class="btn primary" href="'+esc(mapUrl)+'" target="_blank" rel="noopener">Abrir no Google Maps</a>'+
   '<a class="btn" href="'+esc(earthUrl)+'" target="_blank" rel="noopener">Google Earth</a>'+
   '<a class="btn as-profile-wide" href="igreja-publicacoes.html?church='+encodeURIComponent(c.id||'')+'&name='+encodeURIComponent(c.name||'')+'">Mural, relatórios e notícias</a>'+
  '</div>'+
 '</section>';
}
function openGroup(i){
 selectedGroup=churchGroups[i];if(!selectedGroup)return;const g=selectedGroup;
 el('contact-body').innerHTML='<h3 id="as-contact-title">'+esc(g.label)+'</h3><p class="as-status-line">'+g.status.percent+'% preenchido · '+g.status.label+'</p>'+churchProfile(g.church)+(g.status.missing.length?'<p class="as-profile-note"><b>Dados da igreja a completar:</b> '+esc(g.status.missing.join(', '))+'</p>':'')+(isAdmin?'<div class="as-toolbar"><button class="btn primary" data-church-edit="'+esc(g.church.id)+'">Editar igreja</button><button class="btn" data-member-new="1">Cadastrar irmão nesta igreja</button></div>':'<button class="btn" data-admin-access="1">Entrar como administrador para editar</button>')+'<h4 class="as-members-title">Irmãos vinculados ('+g.members.length+')</h4><div class="as-contact-grid">'+g.members.map(contactCard).join('')+'</div>'+(g.members.length?'':'<p>Ainda não há irmãos vinculados a esta igreja.</p>');
 if(!el('contact').open)el('contact').showModal();
}
async function editContact(id){
 if(!isAdmin)throw Error('Entre como administrador para editar.');
 const result=await request('/rest/v1/assibrece_members?select=*&id=eq.'+encodeURIComponent(id));
 if(!result.data?.length)throw Error('Cadastro não encontrado ou acesso expirado.');
 const member=result.data[0];rows=rows.filter(x=>x.id!==id).concat(member);el('contact').close();edit(id);
}
async function loadDirectory(){
 try{
  const listingPromise=fetch(BASE+'/rest/v1/brother_services?select=owner_name,title,type,category,description,whatsapp,status&status=eq.approved&order=owner_name.asc&limit=1000',{headers:{apikey:KEY},cache:'no-store'}).then(r=>r.ok?r.json():[]).catch(()=>[]);
  let all=[];
  for(let offset=0;;offset+=500){
   const res=await fetch(BASE+'/rest/v1/assibrece_directory?select=id,number,name,phone,role_description,church,church_id,profession,offers_services,service_description,profile_photo_url&order=number.asc&limit=500&offset='+offset,{headers:{apikey:KEY},cache:'no-store'});
   if(!res.ok)throw new Error();const batch=await res.json();all.push(...batch);if(batch.length<500)break;
  }
  contacts=all;marketListings=await listingPromise;renderDirectory();
 }catch{el('public-count').textContent='Não foi possível carregar os contatos. Clique em Atualizar para tentar novamente.';}
}
el('public-search').oninput=renderDirectory;el('contact-type').onchange=renderDirectory;
el('church-choices').onchange=e=>{const input=e.target.closest('.as-church-choice');if(!input)return;if(input.checked)selectedChurchIds.add(input.value);else selectedChurchIds.delete(input.value);renderDirectory();};
el('all-churches').onclick=()=>{selectedChurchIds=new Set(directoryChurches().map(c=>c.id));renderDirectory();};
el('clear-churches').onclick=()=>{selectedChurchIds.clear();renderDirectory();};
el('select-filtered').onclick=()=>{filteredContacts().filter(x=>validPhone(x.phone)).forEach(x=>selectedRecipientIds.add(x.id));renderRecipientList(filteredContacts());};
el('clear-recipients').onclick=()=>{selectedRecipientIds.clear();renderRecipientList(filteredContacts());};
el('recipient-list').onchange=e=>{const input=e.target.closest('[data-recipient]');if(!input)return;if(input.checked)selectedRecipientIds.add(input.dataset.recipient);else selectedRecipientIds.delete(input.dataset.recipient);renderRecipientList(filteredContacts());};
el('recipient-list').onclick=directoryClick;
el('prepare-campaign').onclick=prepareCampaign;
el('copy-campaign').onclick=async()=>{const text=el('campaign-message').value.trim();if(!text){el('campaign-status').textContent='Escreva a mensagem antes de copiar.';return;}try{await navigator.clipboard.writeText(text);el('campaign-status').textContent='Mensagem copiada.';}catch{el('campaign-message').select();el('campaign-status').textContent='Selecione e copie a mensagem.';}};
el('open-next').onclick=openNextCampaign;el('mark-sent').onclick=()=>markCampaign('sent');el('skip-contact').onclick=()=>markCampaign('skipped');
el('end-campaign').onclick=()=>{if(confirm('Encerrar e apagar esta fila de envio neste aparelho?')){campaignSave(null);campaignRender();el('campaign-status').textContent='Fila encerrada.';}};
el('contact-close').onclick=()=>el('contact').close();
function prefillClaim(){
 const id=sessionStorage.getItem('assibrece-claim');const x=contacts.find(x=>x.id===id);if(!x)return;
 const form=el('request-form');form.elements.name.value=x.name||'';form.elements.phone.value=x.phone||'';form.elements.church.value=x.church||'';
}
function startSelfEdit(id){
 const mine=rows.find(x=>x.id===id);
 if(mine&&(personalKey||(user&&!isAdmin))){el('contact').close();edit(id);return;}
 if(user&&!isAdmin&&rows.length){message('Sua conta já está vinculada a outra ficha. Entre em contato com o administrador para corrigir o vínculo.',true);el('contact').close();return;}
 sessionStorage.setItem('assibrece-claim',id);el('contact').close();
 if(user&&!isAdmin){prefillClaim();el('request').hidden=false;el('request-form').hidden=false;el('request').scrollIntoView({behavior:'smooth'});message('Confirme os dados e solicite o vínculo. Após a aprovação única do administrador, você poderá editar sua ficha quando precisar.');return;}
 el('login').hidden=false;const details=el('email-access');if(details)details.open=true;el('login').scrollIntoView({behavior:'smooth'});
 message('Para editar com segurança, entre pelo seu e-mail. No primeiro acesso, o administrador confirmará que esta ficha é sua.');
}
function directoryClick(e){
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.group!==undefined)return openGroup(Number(b.dataset.group));
 if(b.dataset.adminAccess){el('contact').close();return el('manage').click();}
 if(b.dataset.churchEdit&&isAdmin){el('contact').close();return openEdit(b.dataset.churchEdit);}
 if(b.dataset.memberNew&&isAdmin){el('contact').close();edit(null);el('editor-form').elements.church.value=selectedGroup.label;el('church-link').value=selectedGroup.church.id;return;}
 if(b.dataset.contactEdit)return guarded(b,()=>editContact(b.dataset.contactEdit));
 if(b.dataset.contactDelete&&isAdmin)return guarded(b,()=>deleteMember(b.dataset.contactDelete));
 if(b.dataset.selfEdit)return startSelfEdit(b.dataset.selfEdit);
 if(!b.dataset.contact)return;
 const x=contacts.find(x=>x.id===b.dataset.contact);if(!x)return;
 let phone=String(x.phone||'').replace(/\D/g,'');if(phone.length===10||phone.length===11)phone='55'+phone;
 const listings=marketFor(x),business=listings.map(item=>item.title+(item.type?' · '+item.type:'')).join(' | ');
 el('contact-body').innerHTML='<div class="as-member-profile-head">'+memberAvatar(x,true)+'<div><h3 id="as-contact-title">'+esc(x.name||'Nome não informado')+'</h3><p>'+esc(x.role_description||'Cargo não informado')+'</p></div></div><dl><dt>Igreja</dt><dd>'+esc(x.church||'Não informada')+'</dd><dt>Cargo</dt><dd>'+esc(x.role_description||'Não informado')+'</dd><dt>Telefone</dt><dd>'+esc(x.phone||'Não informado')+'</dd><dt>Profissão</dt><dd>'+esc(x.profession||'Não informada')+'</dd><dt>Disponível para serviços</dt><dd>'+(serviceProvider(x)?'Sim':'Não informado')+'</dd>'+(x.service_description?'<dt>Serviços</dt><dd>'+esc(x.service_description)+'</dd>':'')+(business?'<dt>Produtos / atividades cadastradas</dt><dd>'+esc(business)+'</dd>':'')+'</dl>'+(validPhone(x.phone)?'<p><a class="btn as-wa" target="_blank" rel="noopener noreferrer" href="https://wa.me/'+phone+'">Conversar pelo WhatsApp</a></p>':'<p>Telefone incompleto ou não informado.</p>')+(isAdmin?'<div class="as-toolbar"><button class="btn primary" data-contact-edit="'+esc(x.id)+'">Editar cadastro</button><button class="btn" data-contact-delete="'+esc(x.id)+'">Excluir duplicata</button></div>':'<div class="as-toolbar"><button class="btn primary" data-self-edit="'+esc(x.id)+'">Este cadastro é meu — editar meus dados</button><button class="btn" data-admin-access="1">Entrar como administrador</button></div>');
 if(!el('contact').open)el('contact').showModal();
}
el('public-groups').onclick=directoryClick;el('contact-body').onclick=directoryClick;
el('manage').onclick=()=>{if(isAdmin){el('admin').scrollIntoView({behavior:'smooth'});el('search').focus();}else document.getElementById('adminLogin').click();};
window.addEventListener('directory-updated',renderDirectory);
loadDirectory();

function message(text,error=false){el('message').textContent=text;el('message').classList.toggle('as-error',error);}
function authHeaders(){const t=session?.access_token||sessionStorage.getItem('church-admin-token');return {apikey:KEY,...(t?{Authorization:'Bearer '+t}:{}),'Content-Type':'application/json'};}
async function request(path,options={}){
 const res=await fetch(BASE+path,{...options,headers:{...authHeaders(),...options.headers},cache:'no-store'});
 const data=await res.json().catch(()=>null);
 if(!res.ok)throw new Error(res.status===401?'Acesso expirado. Entre novamente.':res.status===409?'Esta solicitação ou vínculo já existe. Atualize os dados.':data?.error_description||data?.error||'Não foi possível concluir. Verifique sua conexão e tente novamente.');
 return {data,res};
}
async function edge(action,extra={}){return (await request('/functions/v1/assibrece-access',{method:'POST',body:JSON.stringify({action,token:personalKey,...extra})})).data;}
async function boot(){
 loadDirectory();
 await window.directoryAuthReady;
 try{session=JSON.parse(localStorage.getItem('assibrece-auth')||'null');}catch{session=null;}
 user=null;isAdmin=false;el('manage').textContent='Entrar como administrador';renderDirectory();el('login').hidden=true;el('request').hidden=true;el('admin').hidden=true;el('pagination').hidden=true;el('list').innerHTML='';
 try{
  if(personalKey&&!session?.access_token&&!sessionStorage.getItem('church-admin-token')){
   const data=await edge('read');rows=[data.member];sessionStorage.removeItem('assibrece-claim');renderCards();el('session').textContent='Meu cadastro · acesso por link pessoal';el('logout').hidden=false;message('Atualize seus dados e clique em Salvar cadastro.');return;
  }
  if(session?.access_token||sessionStorage.getItem('church-admin-token')){
   if(session?.refresh_token&&session.expires_at&&session.expires_at<Date.now()/1000+30){
    const {data}=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:session.refresh_token})});
    session={...data,expires_at:Date.now()/1000+data.expires_in};localStorage.setItem('assibrece-auth',JSON.stringify(session));
   }
   user=(await request('/auth/v1/user')).data;
   isAdmin=(await request('/rest/v1/directory_admins?select=user_id&user_id=eq.'+encodeURIComponent(user.id))).data.length>0;
  }
  el('logout').hidden=!user;
  if(!user){el('login').hidden=false;el('session').textContent='Consulta pública · edição protegida';message('Todos podem consultar os contatos acima. Para editar, use seu acesso individual ou de administrador.');return;}
  el('session').textContent=(isAdmin?'Administrador':'Membro')+' · '+user.email;
  if(isAdmin){personalKey='';sessionStorage.removeItem('assibrece-key');adminToken=session?.access_token||sessionStorage.getItem('church-admin-token');sessionStorage.setItem('church-admin-token',adminToken);adminUI();el('manage').textContent='Gerenciar cadastros';renderDirectory();el('admin').hidden=false;await Promise.all([loadRows(),loadRequests()]);}
  else{
   rows=(await request('/rest/v1/assibrece_members?select=*&order=number.asc')).data;
   if(rows.length){sessionStorage.removeItem('assibrece-claim');renderCards();message('Sua ficha está liberada. Clique em “Atualizar meus dados” sempre que precisar.');}
   else{
    el('request').hidden=false;prefillClaim();
    const req=(await request('/rest/v1/assibrece_requests?select=status&user_id=eq.'+user.id)).data[0];
    el('request-form').hidden=!!req;
    el('request-status').textContent=req?(req.status==='rejected'?'Solicitação não aprovada. Entre em contato com o administrador.':'Solicitação recebida. Aguarde a vinculação pelo administrador e clique em Atualizar.') :'';
    message('Seu e-mail foi confirmado. Falta vincular sua ficha.');
   }
  }
 }catch(e){message(e.message,true);el('login').hidden=false;el('logout').hidden=false;}
}
async function loadRows(){
 const seq=++sequence;
 const clean=filter.replace(/[(),.*%\\"']/g,' ').trim();
 let query='/rest/v1/assibrece_members?select=*&order=number.asc&offset='+(page*25)+'&limit=25';
 if(clean)query+='&or='+encodeURIComponent('(name.ilike.*'+clean+'*,phone.ilike.*'+clean+'*,church.ilike.*'+clean+'*,city_neighborhood.ilike.*'+clean+'*)');
 const {data,res}=await request(query,{headers:{Prefer:'count=exact'}});if(seq!==sequence)return;
 rows=data;total=Number((res.headers.get('content-range')||'').split('/')[1])||data.length;
 el('total').textContent=total.toLocaleString('pt-BR');renderCards();
 el('pagination').hidden=false;el('page').textContent='Página '+(page+1)+' de '+Math.max(1,Math.ceil(total/25));el('prev').disabled=page===0;el('next').disabled=(page+1)*25>=total;
 message('Dados online · 25 cadastros por página.');
}
function renderCards(){
 el('list').innerHTML=rows.length?rows.map(x=>`<article class="as-panel as-member-admin-card"><div class="as-card-head">${memberAvatar(x)}<span class="tag">Cadastro ${esc(x.number)}</span><h3>${esc(x.name||'Nome a completar')}</h3></div><dl>${FIELD.filter(([k])=>k!=='name').map(([k,l])=>`<div><dt>${l}</dt><dd>${esc(x[k]||'Não informado')}</dd></div>`).join('')}<div><dt>Disponível para prestar serviços</dt><dd>${x.offers_services?'Sim':'Não'}</dd></div></dl><div class="as-toolbar"><button class="btn primary" data-edit="${esc(x.id)}">${isAdmin?'Editar cadastro':'Atualizar meus dados'}</button>${isAdmin?`<button class="btn as-wa" data-link="${esc(x.id)}">Link pessoal / WhatsApp</button><button class="btn" data-revoke="${esc(x.id)}">Revogar link</button><button class="btn" data-delete="${esc(x.id)}">Excluir duplicata</button>`:''}</div><p class="as-note">Última atualização: ${esc(new Date(x.updated_at).toLocaleString('pt-BR'))}</p></article>`).join(''):'<p class="as-panel">Nenhum cadastro encontrado.</p>';
}
async function allMembers(){let a=[];for(let offset=0;;offset+=500){const batch=(await request('/rest/v1/assibrece_members?select=id,number,name,phone&order=number.asc&limit=500&offset='+offset)).data;a.push(...batch);if(batch.length<500)return a;}}
async function loadRequests(){
 const pending=(await request('/rest/v1/assibrece_requests?select=*&status=eq.pending&order=created_at.asc')).data;
 el('pending').textContent=pending.length;
 if(!pending.length){el('requests').innerHTML='<p>Nenhuma solicitação pendente.</p>';return;}
 const members=await allMembers();
 el('requests').innerHTML=pending.map(r=>`<article class="as-request-card"><h4>${esc(r.name)}</h4><p>${esc(r.email)} · ${esc(r.phone)} · ${esc(r.church)}</p><label>Vincular à ficha existente<select data-target="${esc(r.user_id)}"><option value="">Selecione a ficha correta</option>${members.map(m=>`<option value="${esc(m.id)}">#${esc(m.number)} · ${esc(m.name||'Sem nome')} · ${esc(m.phone)}</option>`).join('')}<option value="new">Criar um novo cadastro</option></select></label><div class="as-toolbar"><button class="btn primary" data-approve="${esc(r.user_id)}">Aprovar vínculo</button><button class="btn" data-reject="${esc(r.user_id)}">Não aprovar</button></div></article>`).join('');
 pending.forEach(r=>{const select=el('requests').querySelector('[data-target="'+r.user_id+'"]');if(!select)return;if(r.requested_member_id&&members.some(m=>m.id===r.requested_member_id))select.value=r.requested_member_id;else{const same=members.filter(m=>personKey(m.name)===personKey(r.name));if(same.length===1)select.value=same[0].id;}});
}
el('church-link').onchange=()=>{const c=typeof churches==='undefined'?null:churches.find(c=>c.id===el('church-link').value);if(c)el('editor-form').elements.church.value=typeof full==='function'?full(c).name:c.name;};
let photoPreviewUrl='';
function showProfilePreview(url){
 const img=el('profile-preview'),placeholder=el('profile-placeholder');
 if(url){img.src=url;img.hidden=false;placeholder.hidden=true;}else{img.removeAttribute('src');img.hidden=true;placeholder.hidden=false;}
}
function edit(id){
 editing=id?rows.find(x=>x.id===id):null;
 el('editor-title').textContent=editing?'Cadastro #'+editing.number:'Novo cadastro';
 FIELD.forEach(([k])=>el('editor-form').elements[k].value=editing?.[k]||'');
 el('offers-services').checked=!!editing?.offers_services;
 el('church-link').value=editing?.church_id||'';el('save-message').textContent='';
 el('profile-photo').value='';photoRemoval=false;showProfilePreview(editing?.profile_photo_url||'');
 el('remove-profile-photo').hidden=!editing?.profile_photo_url;
 el('editor').showModal();
}
el('profile-photo').onchange=()=>{
 const file=el('profile-photo').files?.[0];if(!file)return;
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)){el('save-message').textContent='Use uma foto JPG, PNG ou WebP.';el('profile-photo').value='';return;}
 if(file.size>8*1024*1024){el('save-message').textContent='Escolha uma imagem de até 8 MB.';el('profile-photo').value='';return;}
 if(photoPreviewUrl)URL.revokeObjectURL(photoPreviewUrl);photoPreviewUrl=URL.createObjectURL(file);showProfilePreview(photoPreviewUrl);photoRemoval=false;el('remove-profile-photo').hidden=false;
};
el('remove-profile-photo').onclick=()=>{el('profile-photo').value='';photoRemoval=true;showProfilePreview('');el('remove-profile-photo').hidden=true;};
function compressProfilePhoto(file){
 return new Promise((resolve,reject)=>{
  const url=URL.createObjectURL(file),image=new Image();
  image.onload=()=>{
   try{
    const max=900,scale=Math.min(1,max/image.width,max/image.height),canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));
    canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
    canvas.toBlob(blob=>{URL.revokeObjectURL(url);blob?resolve(blob):reject(new Error('Não foi possível preparar a foto.'));},'image/webp',0.82);
   }catch(error){URL.revokeObjectURL(url);reject(error);}
  };
  image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Não foi possível abrir a foto.'));};image.src=url;
 });
}
function blobBase64(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]||'');reader.onerror=()=>reject(new Error('Não foi possível ler a foto.'));reader.readAsDataURL(blob);});}
async function deleteStoredProfile(url){
 const prefix=BASE+'/storage/v1/object/public/assibrece-profiles/';if(!url?.startsWith(prefix))return;
 const path=url.slice(prefix.length);
 await fetch(BASE+'/storage/v1/object/assibrece-profiles/'+path,{method:'DELETE',headers:authHeaders()}).catch(()=>{});
}
async function uploadProfilePhoto(member,file){
 const blob=await compressProfilePhoto(file);
 if(blob.size>1572864)throw new Error('A foto ficou muito grande. Escolha outra imagem.');
 if(personalKey){const file64=await blobBase64(blob);return (await edge('upload_photo',{file:file64,mime:blob.type||'image/webp'})).member;}
 const path=member.id+'/profile-'+Date.now()+'.webp',token=session?.access_token||sessionStorage.getItem('church-admin-token');
 const upload=await fetch(BASE+'/storage/v1/object/assibrece-profiles/'+path,{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+token,'Content-Type':blob.type||'image/webp','x-upsert':'false'},body:blob});
 if(!upload.ok)throw new Error('Não foi possível enviar a foto. Entre novamente e tente outra vez.');
 const url=BASE+'/storage/v1/object/public/assibrece-profiles/'+path;
 const result=await request('/rest/v1/assibrece_members?id=eq.'+encodeURIComponent(member.id)+'&revision=eq.'+member.revision,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({profile_photo_url:url})});
 if(!result.data?.length)throw new Error('O cadastro mudou durante o envio da foto. Atualize e tente novamente.');
 await deleteStoredProfile(member.profile_photo_url||'');return result.data[0];
}
async function removeProfilePhoto(member){
 if(!member.profile_photo_url)return member;
 if(personalKey)return (await edge('remove_photo')).member;
 const result=await request('/rest/v1/assibrece_members?id=eq.'+encodeURIComponent(member.id)+'&revision=eq.'+member.revision,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({profile_photo_url:''})});
 if(!result.data?.length)throw new Error('O cadastro mudou durante a remoção da foto.');
 await deleteStoredProfile(member.profile_photo_url);return result.data[0];
}
async function deleteMember(id){
 const member=rows.find(x=>x.id===id)||contacts.find(x=>x.id===id);
 if(!member)throw new Error('Cadastro não encontrado. Atualize a página e tente novamente.');
 const summary=(member.name||'Nome não informado')+'\n'+(member.church||'Igreja não informada')+'\n'+(member.phone||'Telefone não informado');
 if(!confirm('Excluir definitivamente esta ficha por ser duplicada?\n\n'+summary+'\n\nEsta ação não pode ser desfeita.'))return;
 if(!confirm('Confirma a exclusão definitiva de '+(member.name||'esta ficha')+'?'))return;
 await request('/rest/v1/assibrece_members?id=eq.'+encodeURIComponent(id),{method:'DELETE'});
 if(el('contact').open)el('contact').close();
 await Promise.all([loadRows(),loadDirectory()]);
 message('Ficha duplicada excluída com sucesso.');
}
async function guarded(button,fn){if(button)button.disabled=true;try{await fn();}catch(e){message(e.message,true);}finally{if(button)button.disabled=false;}}
el('login-form').onsubmit=e=>{e.preventDefault();guarded(e.submitter,async()=>{
 const email=new FormData(e.target).get('email').trim();
 await request('/auth/v1/otp',{method:'POST',body:JSON.stringify({email,create_user:true,email_redirect_to:APP})});
 message('Link solicitado. Confira o e-mail e a pasta de spam. Se não chegar, peça seu link pessoal pelo WhatsApp ao administrador.');
});};
el('admin-login').onclick=()=>document.getElementById('adminLogin').click();
el('request-form').onsubmit=e=>{e.preventDefault();guarded(e.submitter,async()=>{
 const data=Object.fromEntries(new FormData(e.target));data.email=user.email;data.user_id=user.id;data.requested_member_id=sessionStorage.getItem('assibrece-claim')||null;
 await request('/rest/v1/assibrece_requests',{method:'POST',body:JSON.stringify(data)});await boot();
});};
el('editor-form').onsubmit=async e=>{
 e.preventDefault();el('save').disabled=true;el('save-message').textContent='Salvando…';
 try{
  const data=Object.fromEntries(FIELD.map(([k])=>[k,e.target.elements[k].value.trim()]));
  data.offers_services=el('offers-services').checked;
  if(!data.name)throw new Error('Informe o nome completo.');
  if(!editing){const same=contacts.find(x=>personKey(x.name)===personKey(data.name));if(same)throw new Error('Já existe um cadastro com este nome: '+same.name+'. Abra a ficha existente para editar ou excluir a duplicata.');}
  const selected=churchGroups.find(g=>g.church.id===el('church-link').value&&normalize(g.label)===normalize(data.church));const matches=churchGroups.filter(g=>normalize(g.label)===normalize(data.church));data.church_id=selected?.church.id||(matches.length===1?matches[0].church.id:null);
  if(matches.length>1&&!data.church_id)throw new Error('Há igrejas com o mesmo nome. Selecione a igreja e a cidade no campo de vínculo.');
  let saved;
  if(personalKey){
   saved=(await edge('update',{data,revision:editing.revision})).member;
  }else if(editing){
   const result=await request('/rest/v1/assibrece_members?id=eq.'+editing.id+'&revision=eq.'+editing.revision,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(data)});
   if(!result.data?.length)throw new Error('A ficha mudou em outra sessão ou seu acesso expirou. Feche e atualize antes de salvar.');
   saved=result.data[0];
  }else{
   const result=await request('/rest/v1/assibrece_members',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(data)});
   if(!result.data?.length)throw new Error('Não foi possível criar o cadastro.');
   saved=result.data[0];
  }
  const photoFile=el('profile-photo').files?.[0];
  if(photoFile){el('save-message').textContent='Enviando e ajustando a foto…';saved=await uploadProfilePhoto(saved,photoFile);}
  else if(photoRemoval){saved=await removeProfilePhoto(saved);}
  if(isAdmin)await loadRows();else{rows=[saved];renderCards();}
  await loadDirectory();el('editor').close();message('Cadastro e foto salvos no banco online com sucesso.');
 }catch(error){el('save-message').textContent=error.message;}finally{el('save').disabled=false;}
};
el('list').onclick=e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.edit)return edit(b.dataset.edit);
 if(b.dataset.delete)return guarded(b,()=>deleteMember(b.dataset.delete));
 if(b.dataset.revoke){if(!confirm('Invalidar o link pessoal desta ficha? O membro precisará de um novo link.'))return;return guarded(b,async()=>{await edge('revoke_link',{member_id:b.dataset.revoke});message('Link pessoal revogado.');});}
 if(b.dataset.link)guarded(b,async()=>{
  if(!confirm('Gerar um link pessoal válido por 30 dias? Um link anterior desta ficha deixará de funcionar.'))return;
  const member=rows.find(x=>x.id===b.dataset.link);const result=await edge('create_link',{member_id:member.id});
  const url=APP+'#assibrece_key='+result.token;
  el('share-url').value=url;el('share-name').textContent=(member.name||'Cadastro #'+member.number)+' · válido até '+new Date(result.expires_at).toLocaleDateString('pt-BR');
  let phone=(member.phone||'').replace(/\D/g,'');if(phone.length===10||phone.length===11)phone='55'+phone;
  const text='Olá! Este é seu link pessoal para atualizar o cadastro na ASSIBRECE. Não compartilhe este link, pois ele permite editar sua ficha. '+url;
  el('whatsapp').href=(/^\d{12,15}$/.test(phone)?'https://wa.me/'+phone:'https://api.whatsapp.com/send')+'?text='+encodeURIComponent(text);
  el('share-message').textContent='Confira o destinatário antes de enviar.';el('share').showModal();
 });
};
el('requests').onclick=e=>{
 const b=e.target.closest('button');if(!b)return;
 guarded(b,async()=>{
  if(b.dataset.approve){
   const select=el('requests').querySelector('[data-target="'+b.dataset.approve+'"]');if(!select.value)throw new Error('Selecione a ficha do membro.');
   if(!confirm('Confirmar que esta conta pertence ao titular da ficha selecionada?'))return;
   await request('/rest/v1/rpc/assibrece_approve',{method:'POST',body:JSON.stringify({p_user:b.dataset.approve,p_member:select.value==='new'?null:select.value})});
  }else if(b.dataset.reject){await request('/rest/v1/assibrece_requests?user_id=eq.'+b.dataset.reject,{method:'PATCH',body:JSON.stringify({status:'rejected'})});}
  await Promise.all([loadRequests(),loadRows()]);message('Solicitação atualizada.');
 });
};
el('copy').onclick=()=>guarded(el('copy'),async()=>{try{await navigator.clipboard.writeText(el('share-url').value);el('share-message').textContent='Link copiado. Envie apenas ao titular.';}catch{el('share-url').select();el('share-message').textContent='Selecione e copie o link acima.';}});
el('cancel').onclick=()=>el('editor').close();el('share-close').onclick=()=>{el('share').close();el('share-url').value='';el('whatsapp').removeAttribute('href');};
el('new').onclick=()=>edit(null);
el('refresh').onclick=()=>guarded(el('refresh'),boot);
el('prev').onclick=()=>{page=Math.max(0,page-1);guarded(el('prev'),loadRows);};
el('next').onclick=()=>{page++;guarded(el('next'),loadRows);};
let debounce;el('search').oninput=e=>{clearTimeout(debounce);filter=e.target.value;page=0;debounce=setTimeout(()=>guarded(null,loadRows),300);};
el('logout').onclick=()=>guarded(el('logout'),async()=>{
 if(session?.access_token)await request('/auth/v1/logout',{method:'POST'}).catch(()=>{});
 localStorage.removeItem('assibrece-auth');sessionStorage.removeItem('assibrece-key');sessionStorage.removeItem('church-admin-token');session=null;personalKey='';adminToken='';adminUI();await boot();
});
window.addEventListener('assibrece-session',boot);
boot();
if(personalKey||new URLSearchParams(location.search).get('aba')==='assibrece')goView('assibrece');
})();
