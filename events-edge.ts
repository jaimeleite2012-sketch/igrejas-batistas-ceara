const base=Deno.env.get('SUPABASE_URL')!,key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const headers={'Access-Control-Allow-Origin':'https://jaimeleite2012-sketch.github.io','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
const reply=(x:unknown,s=200)=>new Response(JSON.stringify(x),{status:s,headers});
async function db(p:string,m='GET',b?:unknown){const r=await fetch(base+'/rest/v1/'+p,{method:m,headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',Prefer:'return=representation'},body:b===undefined?undefined:JSON.stringify(b)});if(!r.ok)throw Error('Não foi possível salvar os dados.');return r.json();}
Deno.serve(async req=>{if(req.method==='OPTIONS')return new Response('ok',{headers});if(req.method!=='POST')return reply({error:'Método inválido'},405);try{
const raw=await req.text();if(raw.length>3000000)return reply({error:'Imagem muito grande'},413);const b=JSON.parse(raw);let owner='',admin=false;
if(/^[a-f0-9]{64}$/.test(b.token||'')){const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(b.token))),x=>x.toString(16).padStart(2,'0')).join('');const a=await db('assibrece_links?token_hash=eq.'+hash+'&expires_at=gt.'+encodeURIComponent(new Date().toISOString())+'&select=member_id');owner=a[0]?.member_id||'';}
else {const auth=req.headers.get('Authorization')||'';const r=await fetch(base+'/auth/v1/user',{headers:{apikey:key,Authorization:auth}});if(r.ok){const u=await r.json();admin=(await db('directory_admins?user_id=eq.'+encodeURIComponent(u.id)+'&select=user_id')).length>0;owner=admin?u.id:(await db('assibrece_access?user_id=eq.'+encodeURIComponent(u.id)+'&select=member_id'))[0]?.member_id||'';}}
if(!owner)return reply({error:'Entre com seu acesso individual da ASSIBRECE para publicar.'},403);
if(b.action==='identity')return reply({owner,admin});
if(b.action==='upload'){
const match=/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(b.image||'');if(!match)return reply({error:'Use JPG, PNG ou WebP.'},400);const bytes=Uint8Array.from(atob(match[2]),c=>c.charCodeAt(0));if(bytes.length>2097152)return reply({error:'Use imagens de até 2 MB.'},400);
const valid=match[1]==='jpeg'?bytes[0]===255&&bytes[1]===216:match[1]==='png'?bytes[0]===137&&bytes[1]===80:new TextDecoder().decode(bytes.slice(8,12))==='WEBP';if(!valid)return reply({error:'Imagem inválida.'},400);
const path=owner+'/'+crypto.randomUUID()+'.'+match[1];const r=await fetch(base+'/storage/v1/object/assibrece-events/'+path,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'image/'+match[1]},body:bytes});if(!r.ok)throw Error('Falha ao enviar a imagem.');return reply({url:base+'/storage/v1/object/public/assibrece-events/'+path});}
if(!['save','archive'].includes(b.action))return reply({error:'Ação inválida'},400);
let old=null;if(b.id){if(!/^[a-f0-9-]{36}$/.test(b.id))return reply({error:'Evento inválido'},400);old=(await db('assibrece_events?id=eq.'+b.id))[0];if(!old||(!admin&&old.owner_id!==owner))return reply({error:'Você só pode gerenciar suas publicações.'},403);}
if(b.action==='archive'){if(!old)return reply({error:'Evento inválido'},400);await db('assibrece_events?id=eq.'+old.id,'PATCH',{archived:true});return reply({ok:true});}
const data:any={};for(const [k,max] of Object.entries({title:150,kind:40,church:200,location:400,event_date:10,event_time:5,description:4000})){if(typeof b.data?.[k]!=='string'||b.data[k].length>max)return reply({error:'Confira os campos.'},400);data[k]=b.data[k].trim();}
if(!data.title||!data.church||!data.location||!/^\d{4}-\d{2}-\d{2}$/.test(data.event_date)||!Number.isFinite(Date.parse(data.event_date)))return reply({error:'Preencha título, igreja, local e data.'},400);
if(!Array.isArray(b.data.images)||b.data.images.length<1||b.data.images.length>6)return reply({error:'Inclua entre 1 e 6 imagens.'},400);
const prefix=base+'/storage/v1/object/public/assibrece-events/'+owner+'/';if(b.data.images.some((u:unknown)=>typeof u!=='string'||(!u.startsWith(prefix)&&!old?.images.includes(u))))return reply({error:'Imagem não autorizada.'},400);data.images=b.data.images;
if(old){if(!Number.isInteger(b.revision))return reply({error:'Versão inválida'},400);data.revision=old.revision+1;const r=await db('assibrece_events?id=eq.'+old.id+'&revision=eq.'+b.revision,'PATCH',data);if(!r.length)return reply({error:'O evento mudou. Atualize antes de editar.'},409);return reply({ok:true});}
data.owner_id=owner;await db('assibrece_events','POST',data);return reply({ok:true});
}catch(e){return reply({error:e instanceof Error?e.message:'Falha ao processar.'},400);}});
