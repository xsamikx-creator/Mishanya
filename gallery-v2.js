const GALLERY_DB_NAME='mushvig-baku-gallery';
const GALLERY_DB_VERSION=1;
const GALLERY_STORE='photos';
const MAX_GALLERY_PHOTOS=500;
const CLOUD_FOLDER='shared';
let activePhotoIndex=0;
let galleryTimer=null;
let galleryRefreshTimer=null;
let lightboxIndex=0;
let photoIds=[];
let photoPaths=[];
let cloudMode=false;
let cloudClient=null;

function setGalleryNote(text){const note=document.querySelector('#galleryModeNote');if(note)note.textContent=text;}

function initCloudClient(){
  const config=window.MUSHVIG_SUPABASE||{};
  if(!config.url||!config.anonKey||!window.supabase?.createClient)return false;
  cloudClient=window.supabase.createClient(config.url,config.anonKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  cloudMode=true;
  return true;
}

function getBucket(){return window.MUSHVIG_SUPABASE?.bucket||'mushvig-photos';}
function getUploaderName(){
  const user=tg?.initDataUnsafe?.user;
  return (user?.username||user?.first_name||'guest').toString().toLowerCase().replace(/[^a-z0-9а-яё_-]+/gi,'-').slice(0,24)||'guest';
}

async function loadCloudGallery(showError=true){
  try{
    const {data,error}=await cloudClient.storage.from(getBucket()).list(CLOUD_FOLDER,{limit:500,offset:0,sortBy:{column:'created_at',order:'desc'}});
    if(error)throw error;
    const files=(data||[]).filter(item=>item.name&&!item.name.endsWith('/'));
    photos=files.map(item=>cloudClient.storage.from(getBucket()).getPublicUrl(`${CLOUD_FOLDER}/${item.name}`).data.publicUrl);
    photoPaths=files.map(item=>`${CLOUD_FOLDER}/${item.name}`);
    photoIds=[];
    activePhotoIndex=Math.min(activePhotoIndex,Math.max(0,photos.length-1));
    setGalleryNote(`☁️ Общая облачная галерея • кадров: ${photos.length} • видна всем участникам`);
    renderGallery();
  }catch(error){
    console.error('Supabase gallery load error',error);
    if(showError)showMessage('Не удалось открыть общую галерею. Проверь настройки Supabase.');
    setGalleryNote('⚠️ Общая галерея временно недоступна');
  }
}

function startCloudRefresh(){
  clearInterval(galleryRefreshTimer);
  galleryRefreshTimer=setInterval(()=>{if(!document.hidden)loadCloudGallery(false);},15000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&cloudMode)loadCloudGallery(false);});
}

function openGalleryDb(){
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(GALLERY_DB_NAME,GALLERY_DB_VERSION);
    request.onupgradeneeded=()=>{
      const db=request.result;
      if(!db.objectStoreNames.contains(GALLERY_STORE)){
        const store=db.createObjectStore(GALLERY_STORE,{keyPath:'id',autoIncrement:true});
        store.createIndex('createdAt','createdAt');
      }
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
}

async function galleryDbGetAll(){
  const db=await openGalleryDb();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(GALLERY_STORE,'readonly');
    const request=tx.objectStore(GALLERY_STORE).getAll();
    request.onsuccess=()=>resolve(request.result.sort((a,b)=>b.createdAt-a.createdAt));
    request.onerror=()=>reject(request.error);
    tx.oncomplete=()=>db.close();
  });
}

async function galleryDbAdd(data){
  const db=await openGalleryDb();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(GALLERY_STORE,'readwrite');
    const request=tx.objectStore(GALLERY_STORE).add({data,createdAt:Date.now()+Math.random()});
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
    tx.oncomplete=()=>db.close();
  });
}

async function galleryDbDelete(id){
  const db=await openGalleryDb();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(GALLERY_STORE,'readwrite');
    tx.objectStore(GALLERY_STORE).delete(id);
    tx.oncomplete=()=>{db.close();resolve();};
    tx.onerror=()=>{db.close();reject(tx.error);};
  });
}

async function migrateLegacyPhotos(){
  try{
    const legacy=JSON.parse(localStorage.getItem(PHOTO_KEY)||'[]');
    if(!Array.isArray(legacy)||!legacy.length)return;
    const existing=await galleryDbGetAll();
    if(existing.length)return;
    for(const data of legacy){if(typeof data==='string')await galleryDbAdd(data);}
    localStorage.removeItem(PHOTO_KEY);
  }catch(error){console.warn('Не удалось перенести старые фото',error);}
}

async function loadLocalGallery(){
  try{
    await migrateLegacyPhotos();
    const records=await galleryDbGetAll();
    photos=records.map(record=>record.data);
    photoIds=records.map(record=>record.id);
    photoPaths=[];
    activePhotoIndex=Math.min(activePhotoIndex,Math.max(0,photos.length-1));
    setGalleryNote(`📱 Локальная галерея • кадров: ${photos.length} • видна только на этом телефоне`);
    renderGallery();
  }catch(error){console.error(error);showMessage('Не удалось открыть хранилище фотографий.');}
}

function restartGalleryTimer(){clearInterval(galleryTimer);if(photos.length>1)galleryTimer=setInterval(()=>setActivePhoto(activePhotoIndex+1),4500);}
function applyStageBackground(stage,src){stage.style.setProperty('--gallery-bg',`url("${src.replace(/"/g,'\\"')}")`);}

function setActivePhoto(index,animate=true){
  if(!photos.length)return;
  activePhotoIndex=(index+photos.length)%photos.length;
  const main=document.querySelector('.gallery-main');
  const stage=document.querySelector('.gallery-stage');
  if(!main||!stage)return renderGallery();
  if(animate)main.classList.add('changing');
  setTimeout(()=>{
    main.src=photos[activePhotoIndex];
    applyStageBackground(stage,photos[activePhotoIndex]);
    main.classList.remove('changing');
    document.querySelector('.gallery-badge').textContent=`${activePhotoIndex+1} / ${photos.length}`;
    document.querySelectorAll('.gallery-thumb').forEach((thumb,i)=>thumb.classList.toggle('active',i===activePhotoIndex));
    document.querySelector(`.gallery-thumb[data-index="${activePhotoIndex}"]`)?.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
  },animate?170:0);
}

function renderGallery(){
  const box=document.querySelector('#gallery');
  if(!box)return;
  box.innerHTML='';clearInterval(galleryTimer);
  if(!photos.length){box.innerHTML='<div class="empty">📸 Здесь появятся легендарные кадры</div>';return;}
  if(activePhotoIndex>=photos.length)activePhotoIndex=0;
  const stage=document.createElement('div');stage.className='gallery-stage';applyStageBackground(stage,photos[activePhotoIndex]);
  const main=document.createElement('img');main.className='gallery-main';main.src=photos[activePhotoIndex];main.alt='Фото отпуска';main.onclick=()=>openLightbox(activePhotoIndex);
  const badge=document.createElement('div');badge.className='gallery-badge';badge.textContent=`${activePhotoIndex+1} / ${photos.length}`;stage.append(main,badge);
  const strip=document.createElement('div');strip.className='gallery-strip';
  photos.forEach((src,index)=>{const thumb=document.createElement('img');thumb.className=`gallery-thumb${index===activePhotoIndex?' active':''}`;thumb.src=src;thumb.dataset.index=index;thumb.alt=`Фото ${index+1}`;thumb.onclick=()=>{setActivePhoto(index);restartGalleryTimer();};strip.append(thumb);});
  const actions=document.createElement('div');actions.className='gallery-actions';
  const count=document.createElement('small');count.textContent=cloudMode?`В облаке: ${photos.length}`:`На телефоне: ${photos.length}`;
  const remove=document.createElement('button');remove.className='gallery-delete';remove.textContent='Удалить текущее';remove.onclick=()=>removeGalleryPhoto(activePhotoIndex);
  actions.append(count,remove);box.append(stage,strip,actions);restartGalleryTimer();
}

function removeGalleryPhoto(index){
  const remove=async()=>{
    try{
      if(cloudMode){
        const path=photoPaths[index];
        const {error}=await cloudClient.storage.from(getBucket()).remove([path]);
        if(error)throw error;
        await loadCloudGallery(false);
      }else{
        const id=photoIds[index];if(id!==undefined)await galleryDbDelete(id);
        photos.splice(index,1);photoIds.splice(index,1);activePhotoIndex=Math.min(activePhotoIndex,Math.max(0,photos.length-1));renderGallery();
      }
      closeLightbox();
    }catch(error){console.error(error);showMessage('Не удалось удалить фотографию.');}
  };
  if(tg?.showConfirm)tg.showConfirm('Удалить выбранное фото из общей галереи?',ok=>ok&&remove());else if(confirm('Удалить выбранное фото?'))remove();
}

function compressGalleryPhoto(file){
  return new Promise((resolve,reject)=>{
    if(!file.type.startsWith('image/'))return reject(new Error('not-image'));
    const reader=new FileReader();reader.onerror=()=>reject(reader.error);
    reader.onload=()=>{const image=new Image();image.onerror=()=>reject(new Error('decode-error'));image.onload=()=>{
      const maxSide=1600;const scale=Math.min(1,maxSide/Math.max(image.width,image.height));const canvas=document.createElement('canvas');
      canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));
      const context=canvas.getContext('2d',{alpha:false});context.fillStyle='#111';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
      canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('encode-error')),'image/jpeg',.84);
    };image.src=reader.result;};reader.readAsDataURL(file);
  });
}

async function addSelectedPhotos(list){
  if(photos.length>=MAX_GALLERY_PHOTOS)return showMessage(`В галерее уже ${MAX_GALLERY_PHOTOS} фотографий.`);
  const selected=[...list].slice(0,Math.min(20,MAX_GALLERY_PHOTOS-photos.length));let added=0;
  for(const file of selected){
    try{
      const blob=await compressGalleryPhoto(file);
      if(cloudMode){
        const stamp=new Date().toISOString().replace(/[:.]/g,'-');
        const random=crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
        const path=`${CLOUD_FOLDER}/${stamp}-${getUploaderName()}-${random}.jpg`;
        const {error}=await cloudClient.storage.from(getBucket()).upload(path,blob,{contentType:'image/jpeg',cacheControl:'3600',upsert:false});
        if(error)throw error;
      }else{
        const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob);});
        await galleryDbAdd(data);
      }
      added++;
    }catch(error){console.error(error);showMessage('Не удалось загрузить одно из фото. Проверь интернет и настройки облака.');break;}
  }
  if(added){
    state.photos+=added;saveState();renderAll();vibrate('medium');
    if(cloudMode)await loadCloudGallery(false);else await loadLocalGallery();
    showMessage(`Добавлено фото: ${added}`);
  }
}

function openLightbox(index){if(!photos.length)return;lightboxIndex=(index+photos.length)%photos.length;updateLightbox();document.querySelector('#lightbox').classList.add('open');document.body.classList.add('lightbox-open');clearInterval(galleryTimer);}
function updateLightbox(){document.querySelector('#lightboxImage').src=photos[lightboxIndex];document.querySelector('#lightboxCounter').textContent=`${lightboxIndex+1} / ${photos.length}`;}
function moveLightbox(step){lightboxIndex=(lightboxIndex+step+photos.length)%photos.length;updateLightbox();vibrate('light');}
function closeLightbox(){document.querySelector('#lightbox').classList.remove('open');document.body.classList.remove('lightbox-open');restartGalleryTimer();}
function downloadCurrentPhoto(){if(!photos.length)return;const link=document.createElement('a');link.href=photos[lightboxIndex];link.download=`mushvig-baku-${String(lightboxIndex+1).padStart(3,'0')}.jpg`;link.target='_blank';document.body.appendChild(link);link.click();link.remove();}

document.querySelector('#photoInput').onchange=async event=>{const files=[...event.target.files];event.target.value='';await addSelectedPhotos(files);};
document.querySelector('#lightboxClose').onclick=closeLightbox;
document.querySelector('#lightboxPrev').onclick=()=>moveLightbox(-1);
document.querySelector('#lightboxNext').onclick=()=>moveLightbox(1);
document.querySelector('#lightboxDownload').onclick=downloadCurrentPhoto;
document.querySelector('#lightbox').onclick=event=>{if(event.target.id==='lightbox')closeLightbox();};
let touchStartX=0;
document.querySelector('#lightbox').addEventListener('touchstart',event=>touchStartX=event.touches[0].clientX,{passive:true});
document.querySelector('#lightbox').addEventListener('touchend',event=>{const delta=event.changedTouches[0].clientX-touchStartX;if(Math.abs(delta)>45)moveLightbox(delta>0?-1:1);},{passive:true});

(async()=>{
  if(initCloudClient()){
    setGalleryNote('☁️ Подключаем общую облачную галерею…');
    await loadCloudGallery();
    startCloudRefresh();
  }else{
    await loadLocalGallery();
  }
})();
