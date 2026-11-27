const BASE = Deno.env.get('SUPABASE_URL')!;
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CORS = {'Access-Control-Allow-Origin':'https://jaimeleite2012-sketch.github.io','Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin','Cache-Control':'no-store','Content-Type':'application/json'};
const fields: Record<string,number> = {name:200,phone:40,role_description:300,church:300,email:254,city_neighborhood:300,profession:500,service_description:1000,notes:2000};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function response(data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers:CORS});}
async function rest(path:string,method='GET',body?:unknown){
 const res=await fetch(BASE+'/rest/v1/'+path,{method,headers:{apikey:SERVICE,Authorization:'Bearer '+SERVICE,'Content-Type':'application/json',Prefer:'return=representation,resolution=merge-duplicates'},body:body===undefined?undefined:JSON.stringify(body)});
 if(!res.ok)throw new Error('database');return res.status===204?null:await res.json();
}
async function linkMember(token:string){
 if(!/^[0-9a-f]{64}$/.test(token||''))return null;
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),x=>x.toString(16).padStart(2,'0')).join('');
 const links=await rest('assibrece_links?token_hash=eq.'+hash+'&expires_at=gt.'+encodeURIComponent(new Date().toISOString())+'&select=member_id');
 return links.length===1?links[0].member_id:null;
}
function decodePhoto(base64:string,mime:string){
 if(!['image/jpeg','image/png','image/webp'].includes(mime))throw new Error('photo_type');
 const binary=atob(base64);if(!binary.length||binary.length>1572864)throw new Error('photo_size');
 const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
 const jpeg=bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;
 const png=bytes[0]===0x89&&bytes[1]===0x50&&bytes[2]===0x4e&&bytes[3]===0x47;
 const webp=bytes[0]===0x52&&bytes[1]===0x49&&bytes[2]===0x46&&bytes[3]===0x46&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
 if((mime==='image/jpeg'&&!jpeg)||(mime==='image/png'&&!png)||(mime==='image/webp'&&!webp))throw new Error('photo_type');
 return bytes;
}
async function uploadPhoto(id:string,base64:string,mime:string){
 const bytes=decodePhoto(base64,mime),ext=mime==='image/png'?'png':mime==='image/webp'?'webp':'jpg';
 const path=id+'/profile-'+Date.now()+'.'+ext;
 const res=await fetch(BASE+'/storage/v1/object/assibrece-profiles/'+path,{method:'POST',headers:{apikey:SERVICE,Authorization:'Bearer '+SERVICE,'Content-Type':mime,'x-upsert':'false'},body:bytes});
 if(!res.ok)throw new Error('storage');
 return BASE+'/storage/v1/object/public/assibrece-profiles/'+path;
}
async function removeStoredPhoto(url:string){
 const prefix=BASE+'/storage/v1/object/public/assibrece-profiles/';
 if(!url.startsWith(prefix))return;
 const path=url.slice(prefix.length);
 await fetch(BASE+'/storage/v1/object/assibrece-profiles/'+path,{method:'DELETE',headers:{apikey:SERVICE,Authorization:'Bearer '+SERVICE}});
}
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:CORS});
 if(req.method!=='POST')return response({error:'Método inválido.'},405);
 try{
  const raw=await req.text();if(raw.length>2600000)return response({error:'Imagem muito extensa. Escolha outra foto.'},413);
  const b=JSON.parse(raw);
  if(b.action==='create_link'||b.action==='revoke_link'){
   const authorization=req.headers.get('authorization')||'';
   if(!authorization.startsWith('Bearer '))return response({error:'Entre como administrador.'},401);
   const u=await fetch(BASE+'/auth/v1/user',{headers:{apikey:SERVICE,Authorization:authorization}});
   if(!u.ok)return response({error:'Acesso expirado. Entre novamente.'},401);
   const user=await u.json();
   if(!user.id||!uuid.test(user.id))return response({error:'Acesso negado.'},403);
   const admins=await rest('directory_admins?user_id=eq.'+user.id+'&select=user_id');
   if(!admins.length)return response({error:'Acesso exclusivo do administrador.'},403);
   if(!uuid.test(b.member_id||''))return response({error:'Cadastro inválido.'},400);
   const rows=await rest('assibrece_members?id=eq.'+b.member_id+'&select=id');
   if(!rows.length)return response({error:'Cadastro não encontrado.'},404);
   if(b.action==='revoke_link'){await rest('assibrece_links?member_id=eq.'+b.member_id,'DELETE');return response({ok:true});}
   const bytes=crypto.getRandomValues(new Uint8Array(32));
   const token=Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
   const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),x=>x.toString(16).padStart(2,'0')).join('');
   const expires=new Date(Date.now()+30*86400000).toISOString();
   await rest('assibrece_links?on_conflict=member_id','POST',{member_id:b.member_id,token_hash:hash,expires_at:expires,created_at:new Date().toISOString()});
   return response({token,expires_at:expires});
  }
  if(!['read','update','upload_photo','remove_photo'].includes(b.action))return response({error:'Ação inválida.'},400);
  const id=await linkMember(b.token);
  if(!id)return response({error:'Link expirado ou substituído. Solicite um novo ao administrador.'},401);
  if(b.action==='read'){
   const rows=await rest('assibrece_members?id=eq.'+id+'&select=*');
   return rows.length?response({member:rows[0]}):response({error:'Cadastro não encontrado.'},404);
  }
  if(b.action==='upload_photo'){
   if(typeof b.file!=='string'||typeof b.mime!=='string')return response({error:'Selecione uma foto válida.'},400);
   const current=await rest('assibrece_members?id=eq.'+id+'&select=profile_photo_url');
   if(!current.length)return response({error:'Cadastro não encontrado.'},404);
   const url=await uploadPhoto(id,b.file,b.mime);
   const rows=await rest('assibrece_members?id=eq.'+id,'PATCH',{profile_photo_url:url});
   await removeStoredPhoto(current[0].profile_photo_url||'');
   return response({member:rows[0]});
  }
  if(b.action==='remove_photo'){
   const current=await rest('assibrece_members?id=eq.'+id+'&select=profile_photo_url');
   if(!current.length)return response({error:'Cadastro não encontrado.'},404);
   const rows=await rest('assibrece_members?id=eq.'+id,'PATCH',{profile_photo_url:''});
   await removeStoredPhoto(current[0].profile_photo_url||'');
   return response({member:rows[0]});
  }
  if(!b.data||typeof b.data!=='object'||!Number.isInteger(b.revision)||b.revision<1)return response({error:'Dados inválidos.'},400);
  const data:Record<string,unknown>={};
  for(const [key,max] of Object.entries(fields)){
   if(typeof b.data[key]!=='string'||b.data[key].length>max)return response({error:'Confira os campos do cadastro.'},400);
   data[key]=b.data[key].trim();
  }
  if(!data.name)return response({error:'Informe seu nome.'},400);
  if(data.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email)))return response({error:'Confira o e-mail.'},400);
  data.offers_services=b.data.offers_services===true;
  data.church_id=typeof b.data.church_id==='string'&&b.data.church_id.length<=200&&b.data.church_id?b.data.church_id:null;
  const rows=await rest('assibrece_members?id=eq.'+id+'&revision=eq.'+b.revision,'PATCH',data);
  if(!rows.length)return response({error:'Esta ficha foi atualizada em outra sessão. Recarregue antes de salvar.'},409);
  return response({member:rows[0]});
 }catch(error){
  const code=error instanceof Error?error.message:'';
  if(code==='photo_size')return response({error:'A foto ficou muito grande. Escolha outra imagem.'},413);
  if(code==='photo_type')return response({error:'Use uma foto JPG, PNG ou WebP válida.'},400);
  return response({error:'Não foi possível concluir. Tente novamente.'},500);
 }
});
