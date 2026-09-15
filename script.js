const SUPABASE_URL="https://jjqsolqmxwqpmkgpthxu.supabase.co";
const SUPABASE_KEY="sb_publishable_--RTYHM598QbOMn3TamDGA_Z6Fvbqm9";
const supabaseClient=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

const BAG_KEY="dih_signature_bag_v2";
let products=[], bag=JSON.parse(localStorage.getItem(BAG_KEY)||"[]"), activeCategory="Todos";
let selectedProduct=null, currentPhotos=[], currentPhotoPaths=[];

function storagePathFromUrl(url=""){
  const marker="/storage/v1/object/public/produtos/";
  const i=String(url).indexOf(marker);
  if(i<0)return "";
  try{return decodeURIComponent(String(url).slice(i+marker.length));}catch{return String(url).slice(i+marker.length);}
}
function money(v){return Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});}
function escapeHtml(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function placeholder(name){return "data:image/svg+xml;charset=UTF-8,"+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="450" height="800"><rect width="100%" height="100%" fill="#eee7e9"/><text x="50%" y="48%" text-anchor="middle" font-family="Georgia" font-size="25" fill="#76548f">${name}</text><text x="50%" y="54%" text-anchor="middle" font-family="Arial" font-size="11" fill="#8b828b">ADICIONE A FOTO</text></svg>`);}
function imgOf(p){return p.photos?.length?p.photos[0].url:placeholder(p.nome||p.name||"Produto");}
function saveBag(){localStorage.setItem(BAG_KEY,JSON.stringify(bag));updateBagCount();}
function updateBagCount(){document.getElementById("bagCount").textContent=bag.reduce((a,b)=>a+b.qty,0);}

async function loadProducts(){
  const {data,error}=await supabaseClient.from("produtos").select("*,fotos_produtos(*)").eq("ativo",true).order("criado_em",{ascending:false});
  if(error){console.error(error); alert("Não consegui carregar os produtos do banco. Verifique se as tabelas e permissões foram configuradas."); return;}
  products=(data||[]).map(p=>({...p,photos:(p.fotos_produtos||[]).sort((a,b)=>a.ordem-b.ordem)}));
  renderProducts(); renderAdmin();
}
function renderCategories(){
  const cats=["Todos","Brincos","Colares","Pulseiras","Anéis","Conjuntos"];
  document.getElementById("categories").innerHTML=cats.map(c=>`<button class="${activeCategory===c?"active":""}" onclick="setCategory('${c}')">${c}</button>`).join("");
}
function setCategory(c){activeCategory=c;renderProducts();}
function renderProducts(){
  renderCategories();
  const q=(document.getElementById("searchInput")?.value||"").toLowerCase().trim();
  const filtered=products.filter(p=>(activeCategory==="Todos"||p.categoria===activeCategory)&&(!q||`${p.nome} ${p.categoria}`.toLowerCase().includes(q)));
  document.getElementById("productCount").textContent=`${filtered.length} ${filtered.length===1?"peça":"peças"}`;
  document.getElementById("productGrid").innerHTML=filtered.map(p=>`
    <article class="product-card" onclick="openProduct('${p.id}')">
      <div class="photo-frame"><img src="${imgOf(p)}" alt="${escapeHtml(p.nome)}">${p.photos.length>1?`<span class="photo-badge">+${p.photos.length-1} fotos</span>`:""}</div>
      <div class="product-meta"><h3>${escapeHtml(p.nome)}</h3><p>${escapeHtml(p.categoria)}</p><span class="price">${money(p.preco)}</span></div>
    </article>`).join("");
  document.getElementById("emptyState").classList.toggle("hidden",filtered.length>0);
}
function toggleSearch(){document.getElementById("searchBar").classList.toggle("hidden");document.getElementById("searchInput").focus();}
function showStore(){closeAdmin();window.scrollTo({top:0,behavior:"smooth"});}

function openProduct(id){
  selectedProduct=products.find(p=>p.id===id); if(!selectedProduct)return;
  document.getElementById("productModal").classList.remove("hidden"); renderGallery(0);
  document.getElementById("modalInfo").innerHTML=`<p class="eyebrow">${escapeHtml(selectedProduct.categoria)}</p><h2>${escapeHtml(selectedProduct.nome)}</h2><div class="modal-price">${money(selectedProduct.preco)}</div><p class="description">${escapeHtml(selectedProduct.descricao||"Uma semijoia escolhida para você.")}</p><p class="stock">${selectedProduct.estoque>0?`Disponível · ${selectedProduct.estoque} em estoque`:"Produto esgotado"}</p><button class="primary full" ${selectedProduct.estoque<1?"disabled":""} onclick="addToBag('${selectedProduct.id}')">Adicionar à sacola</button>`;
}
function renderGallery(index){
  const p=selectedProduct, photos=p.photos?.length?p.photos:[{url:placeholder(p.nome)}];
  document.getElementById("modalGallery").innerHTML=`<div class="main-photo"><img src="${photos[index].url}" alt="${escapeHtml(p.nome)}"></div><div class="thumbs">${photos.map((x,i)=>`<button class="${i===index?"active":""}" onclick="renderGallery(${i})"><img src="${x.url}"></button>`).join("")}</div>`;
}
function closeProductModal(){document.getElementById("productModal").classList.add("hidden");}

function addToBag(id){
  const p=products.find(x=>x.id===id);if(!p||p.estoque<1)return;
  const item=bag.find(x=>x.id===id);if(item){if(item.qty<p.estoque)item.qty++;}else bag.push({id,qty:1});
  saveBag();closeProductModal();openBag();
}
function openBag(){document.getElementById("bagModal").classList.remove("hidden");renderBag();}
function closeBag(){document.getElementById("bagModal").classList.add("hidden");}
function renderBag(){
  const box=document.getElementById("bagItems");
  if(!bag.length){box.innerHTML=`<p style="color:#7c737c;font-size:12px;padding:25px 0">Sua sacola está vazia.</p>`;document.getElementById("bagTotal").textContent=money(0);return;}
  let total=0;
  box.innerHTML=bag.map(item=>{const p=products.find(x=>x.id===item.id);if(!p)return"";total+=p.preco*item.qty;return `<div class="bag-item"><img src="${imgOf(p)}"><div><h4>${escapeHtml(p.nome)}</h4><p>${item.qty} × ${money(p.preco)}</p></div><button class="remove" onclick="removeBag('${p.id}')">×</button></div>`}).join("");
  document.getElementById("bagTotal").textContent=money(total);
}
function removeBag(id){bag=bag.filter(x=>x.id!==id);saveBag();renderBag();}
function checkoutWhatsApp(){
  if(!bag.length)return;
  let text="Olá! Quero fazer um pedido na Dih Signature:%0A%0A",total=0;
  bag.forEach(i=>{const p=products.find(x=>x.id===i.id);if(p){total+=p.preco*i.qty;text+=`• ${encodeURIComponent(p.nome)} — ${i.qty} un. — ${encodeURIComponent(money(p.preco*i.qty))}%0A`;}});
  text+=`%0A*Total: ${encodeURIComponent(money(total))}*`;
  const phone="5511999999999";
  window.open(`https://wa.me/${phone}?text=${text}`,"_blank");
}

/* ADMIN / SUPABASE AUTH */
async function openAdmin(){
  const {data}=await supabaseClient.auth.getSession();
  if(data.session){document.getElementById("adminModal").classList.remove("hidden");renderAdmin();}
  else {document.getElementById("loginModal").classList.remove("hidden");setTimeout(()=>document.getElementById("loginUser").focus(),100);}
}
async function loginAdmin(e){
  e.preventDefault();
  const email=document.getElementById("loginUser").value.trim();
  const password=document.getElementById("loginPass").value;
  const err=document.getElementById("loginError");
  const {error}=await supabaseClient.auth.signInWithPassword({email,password});
  if(error){
    console.error("Supabase Auth:", error);
    let msg="Não foi possível entrar.";
    if(error.message==="Invalid login credentials") msg="E-mail ou senha incorretos.";
    else if(error.message.toLowerCase().includes("email not confirmed")) msg="Este e-mail ainda não foi confirmado no Supabase.";
    else if(error.message.toLowerCase().includes("failed to fetch")) msg="O site não conseguiu se conectar ao Supabase. Verifique a internet e a URL do projeto.";
    else msg="Supabase: "+error.message;
    err.textContent=msg;err.classList.remove("hidden");return;
  }
  err.classList.add("hidden");document.getElementById("loginPass").value="";
  document.getElementById("loginModal").classList.add("hidden");
  document.getElementById("adminModal").classList.remove("hidden");renderAdmin();
}
async function logoutAdmin(){await supabaseClient.auth.signOut();closeAdmin();}
function closeAdmin(){document.getElementById("adminModal").classList.add("hidden");}

function showAdminTab(tab,btn){
  document.getElementById("adminProducts").classList.toggle("hidden",tab!=="products");
  document.getElementById("productForm").classList.toggle("hidden",tab!=="form");
  document.getElementById("bulkImport").classList.toggle("hidden",tab!=="bulk");
  if(btn){document.querySelectorAll(".admin-tabs button").forEach(b=>b.classList.remove("active"));btn.classList.add("active");}
  if(tab==="products")renderAdmin();
}
function renderAdmin(){
  const box=document.getElementById("adminProducts"); if(!box)return;
  box.innerHTML=products.map(p=>`<div class="admin-row"><img src="${imgOf(p)}"><div><h4>${escapeHtml(p.nome)}</h4><small>${escapeHtml(p.categoria)} · ${money(p.preco)} · estoque: ${p.estoque}</small></div><button onclick="editProduct('${p.id}')">Editar <span class="edit-label">produto</span></button><button onclick="deleteProduct('${p.id}')">Excluir</button></div>`).join("")||"<p>Nenhum produto cadastrado.</p>";
}
function newProduct(){
  document.getElementById("editId").value="";document.getElementById("pCode").value="";document.getElementById("pName").value="";document.getElementById("pCategory").value="Brincos";document.getElementById("pPrice").value="";document.getElementById("pStock").value="";document.getElementById("pDescription").value="";currentPhotos=[];currentPhotoPaths=[];renderPhotoPreview();
  showAdminTab("form"); document.querySelector(".admin-tabs button:nth-child(2)").classList.add("active");
}
function editProduct(id){
  const p=products.find(x=>x.id===id);if(!p)return;
  document.getElementById("editId").value=p.id;document.getElementById("pCode").value=p.codigo||"";document.getElementById("pName").value=p.nome;document.getElementById("pCategory").value=p.categoria;document.getElementById("pPrice").value=p.preco;document.getElementById("pStock").value=p.estoque;document.getElementById("pDescription").value=p.descricao||"";
  currentPhotos=p.photos.map(x=>x.url);currentPhotoPaths=p.photos.map(x=>storagePathFromUrl(x.url));renderPhotoPreview();showAdminTab("form");
}
async function deleteProduct(id){
  if(!confirm("Excluir este produto e suas fotos?"))return;
  const p=products.find(x=>x.id===id);
  if(p?.photos?.length){const paths=p.photos.map(x=>storagePathFromUrl(x.url)).filter(Boolean);if(paths.length)await supabaseClient.storage.from("produtos").remove(paths);}
  const {error}=await supabaseClient.from("produtos").delete().eq("id",id);
  if(error){alert("Não foi possível excluir: "+error.message);return;}
  await loadProducts();
}
function previewPhotos(e){
  [...e.target.files].forEach(file=>{
    const r=new FileReader();r.onload=()=>{currentPhotos.push(r.result);currentPhotoPaths.push({file,uploaded:false});renderPhotoPreview()};r.readAsDataURL(file);
  });
}
function renderPhotoPreview(){document.getElementById("photoPreview").innerHTML=currentPhotos.map((src,i)=>`<div class="preview-item"><img src="${src}"><button type="button" onclick="currentPhotos.splice(${i},1);currentPhotoPaths.splice(${i},1);renderPhotoPreview()">×</button></div>`).join("");}

async function uploadNewPhotos(productId){
  const urls=[], paths=[];
  for(let i=0;i<currentPhotos.length;i++){
    const item=currentPhotoPaths[i];
    if(item && item.uploaded===false && item.file){
      const ext=(item.file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"");
      const path=`${productId}/${crypto.randomUUID()}.${ext||"jpg"}`;
      const {error}=await supabaseClient.storage.from("produtos").upload(path,item.file,{contentType:item.file.type||"image/jpeg",upsert:false});
      if(error)throw error;
      const {data}=supabaseClient.storage.from("produtos").getPublicUrl(path);
      urls.push(data.publicUrl);paths.push(path);
    }
  }
  return {urls,paths};
}
async function saveProduct(e){
  e.preventDefault();
  const {data:sessionData}=await supabaseClient.auth.getSession();
  if(!sessionData.session){alert("Sua sessão expirou. Entre novamente.");return;}
  const id=document.getElementById("editId").value||crypto.randomUUID();
  const codigo=(document.getElementById("pCode").value.trim()||`MAN-${id.slice(0,8)}`).toUpperCase();
  const payload={id,codigo,nome:document.getElementById("pName").value.trim(),categoria:document.getElementById("pCategory").value,preco:Number(document.getElementById("pPrice").value),estoque:Number(document.getElementById("pStock").value),descricao:document.getElementById("pDescription").value.trim(),ativo:true};
  if(!payload.nome){alert("Informe o nome do produto.");return;}
  let {error}=await supabaseClient.from("produtos").upsert(payload);
  if(error){alert("Erro ao salvar produto: "+error.message);return;}
  try{
    const newUploads=await uploadNewPhotos(id);
    if(newUploads.urls.length){
      const rows=newUploads.urls.map((url,i)=>({produto_id:id,url,ordem:i}));
      const {error:photoError}=await supabaseClient.from("fotos_produtos").insert(rows);
      if(photoError)throw photoError;
    }
  }catch(err){alert("Produto salvo, mas houve erro ao enviar uma foto: "+err.message);}
  alert("Produto salvo no banco com sucesso!");
  currentPhotos=[];currentPhotoPaths=[];await loadProducts();showAdminTab("products");
}
function exportProducts(){
  const blob=new Blob([JSON.stringify(products,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="dih-signature-backup.json";a.click();URL.revokeObjectURL(a.href);
}
async function importProducts(event){
  const file=event?.target?.files?.[0];
  if(!file)return;
  try{
    const text=await file.text();
    const imported=JSON.parse(text);
    const rows=(Array.isArray(imported)?imported:[]).map(p=>({codigo:(p.codigo||`IMP-${crypto.randomUUID().slice(0,8)}`).toUpperCase(),nome:p.nome||"",categoria:p.categoria||"Brincos",preco:Number(p.preco||0),estoque:Number(p.estoque||0),descricao:p.descricao||"",ativo:p.ativo!==false})).filter(p=>p.nome);
    if(!rows.length)throw new Error("O arquivo não contém produtos válidos.");
    const {error}=await supabaseClient.from("produtos").upsert(rows,{onConflict:"codigo"});
    if(error)throw error;
    alert(`${rows.length} produto(s) importado(s) com sucesso.`); await loadProducts();
  }catch(err){console.error(err);alert("Erro ao importar backup: "+err.message);}
}

function normalizeHeader(v){
  return String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/\s+/g,"_");
}
function normalizeCategory(v){
  const x=String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
  const map={brincos:"Brincos",brinco:"Brincos",colares:"Colares",colar:"Colares",pulseiras:"Pulseiras",pulseira:"Pulseiras",aneis:"Anéis",anel:"Anéis",conjuntos:"Conjuntos",conjunto:"Conjuntos"};
  return map[x]||"Brincos";
}
function parsePrice(v){
  if(typeof v==="number")return v;
  let s=String(v||"").replace(/R\$/gi,"").replace(/\s/g,"");
  if(s.includes(","))s=s.replace(/\./g,"").replace(",",".");
  return Number(s)||0;
}
async function downloadExcelTemplate(){
  if(typeof XLSX==="undefined"){alert("A biblioteca do Excel ainda não carregou. Verifique a internet e tente novamente.");return;}
  const rows=[
    {codigo:"BR001",nome:"Brinco Lua",categoria:"Brincos",preco:89.90,estoque:10,descricao:"Brinco delicado"},
    {codigo:"CL001",nome:"Colar Coração",categoria:"Colares",preco:129.90,estoque:5,descricao:"Colar delicado"}
  ];
  const ws=XLSX.utils.json_to_sheet(rows); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,"Produtos");
  XLSX.writeFile(wb,"modelo-produtos-dih-signature.xlsx");
}
async function importExcel(event){
  const file=event?.target?.files?.[0]; if(!file)return;
  const status=document.getElementById("bulkExcelStatus");
  status.textContent="Lendo planilha...";
  try{
    if(typeof XLSX==="undefined")throw new Error("A biblioteca do Excel não carregou. Verifique a internet e tente novamente.");
    const buffer=await file.arrayBuffer();
    const wb=XLSX.read(buffer,{type:"array"});
    const sheet=wb.Sheets[wb.SheetNames[0]];
    const raw=XLSX.utils.sheet_to_json(sheet,{defval:""});
    if(!raw.length)throw new Error("A planilha está vazia.");
    const rows=raw.map((r,idx)=>{
      const x={};Object.keys(r).forEach(k=>x[normalizeHeader(k)]=r[k]);
      const codigo=String(x.codigo||x.cod||x.sku||`IMP-${Date.now().toString(36).toUpperCase()}-${String(idx+1).padStart(3,"0")}`).trim().toUpperCase();
      return {codigo,nome:String(x.nome||x.produto||x.name||"").trim(),categoria:normalizeCategory(x.categoria||x.category),preco:parsePrice(x.preco??x.preco_venda??x.price),estoque:Math.max(0,parseInt(x.estoque??x.stock,10)||0),descricao:String(x.descricao||x.description||"").trim(),ativo:String(x.ativo).toLowerCase()!=="false"};
    }).filter(r=>r.nome);
    if(!rows.length)throw new Error("Nenhuma linha com nome de produto foi encontrada.");
    const {error}=await supabaseClient.from("produtos").upsert(rows,{onConflict:"codigo"});
    if(error)throw error;
    status.textContent=`✓ ${rows.length} produto(s) importado(s).`;
    await loadProducts();
  }catch(err){console.error(err);status.textContent="✕ "+err.message;alert("Erro ao importar Excel: "+err.message);}
}
async function importBulkPhotos(event){
  const files=[...(event?.target?.files||[])]; if(!files.length)return;
  const status=document.getElementById("bulkPhotoStatus"); status.textContent="Procurando os códigos no banco...";
  try{
    const {data:dbProducts,error}=await supabaseClient.from("produtos").select("id,codigo,nome");
    if(error)throw error;
    const byCode=new Map((dbProducts||[]).filter(p=>p.codigo).map(p=>[String(p.codigo).trim().toUpperCase(),p]));
    let ok=0,notFound=0,failed=0;
    for(const file of files){
      const base=file.name.replace(/\.[^.]+$/,"" ).trim().toUpperCase();
      const product=byCode.get(base);
      if(!product){notFound++;continue;}
      try{
        const ext=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"")||"jpg";
        const path=`${product.id}/${crypto.randomUUID()}.${ext}`;
        const {error:uploadError}=await supabaseClient.storage.from("produtos").upload(path,file,{contentType:file.type||"image/jpeg",upsert:false});
        if(uploadError)throw uploadError;
        const {data:pub}=supabaseClient.storage.from("produtos").getPublicUrl(path);
        const {data:existing}=await supabaseClient.from("fotos_produtos").select("ordem").eq("produto_id",product.id).order("ordem",{ascending:false}).limit(1);
        const ordem=(existing?.[0]?.ordem??-1)+1;
        const {error:dbError}=await supabaseClient.from("fotos_produtos").insert({produto_id:product.id,url:pub.publicUrl,ordem});
        if(dbError)throw dbError;
        ok++;
      }catch(err){console.error(file.name,err);failed++;}
    }
    status.textContent=`✓ ${ok} foto(s) adicionada(s). ${notFound} sem código correspondente. ${failed} com erro.`;
    await loadProducts();
  }catch(err){console.error(err);status.textContent="✕ "+err.message;alert("Erro ao importar fotos: "+err.message);}
}

renderProducts();updateBagCount();checkSupabaseConnection();loadProducts();

async function checkSupabaseConnection(){
  const box=document.getElementById("connectionStatus");
  try{
    const {error}=await supabaseClient.from("produtos").select("id").limit(1);
    if(error) throw error;
    if(box){box.textContent="● Conectado ao banco";box.className="connection-status ok";}
  }catch(error){
    console.error("Conexão Supabase:",error);
    if(box){box.textContent="● Banco não conectado";box.className="connection-status fail";}
  }
}
