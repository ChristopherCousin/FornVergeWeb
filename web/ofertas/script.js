// Ofertas MASSA filtradas por local
console.log('🥐 Ofertas MASSA - iniciando');

let supabaseClient = null;
function initSupabase(){
  try{
    if(window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.URL){
      supabaseClient = window.SUPABASE_CONFIG.client;
      return true;
    }
    return false;
  }catch(e){ return false; }
}

function getQueryParam(name){ const p=new URLSearchParams(location.search); return p.get(name)||''; }
const locationSlug=(getQueryParam('local')||'').toLowerCase();

class OfertasMassa{
  constructor(){
    this.offersContainer=document.getElementById('offers-container');
    this.loading=document.getElementById('loading');
    this.emptyState=document.getElementById('empty-state');
    this.offers=[];
    this.init();
  }
  async init(){
    if(!initSupabase()){ this.showEmpty(); return; }
    await this.loadOffers();
    setInterval(()=>this.loadOffers(), 30000);
  }
  async loadOffers(){
    try{
      const today=new Date().toISOString().split('T')[0];
      let query = supabaseClient.from('offers')
        .select('*')
        .lte('start_date', today)
        .gte('end_date', today)
        .eq('is_active', true)
        .order('priority', {ascending:false})
        .order('created_at', {ascending:false});
      if(locationSlug){ query = query.eq('location', locationSlug); }
      const { data, error } = await query;
      if(error){ console.error(error); this.showEmpty(); return; }
      this.offers = data||[];
      this.render();
    }catch(e){ console.error(e); this.showEmpty(); }
  }
  render(){
    this.loading.style.display='none';
    if(!this.offers.length){ this.showEmpty(); return; }
    this.offersContainer.style.display='block';
    this.emptyState.style.display='none';
    this.offersContainer.innerHTML='';
    this.offers.forEach((offer, idx)=>{
      this.offersContainer.appendChild(this.card(offer, idx));
    });
  }
  card(offer, idx){
    const div=document.createElement('div');
    div.className='offer-card';
    const endDate=new Date(offer.end_date); const today=new Date();
    const daysLeft=Math.ceil((endDate - today)/(1000*60*60*24));
    div.innerHTML=`
      <h3 class="offer-title font-serif">${offer.title||'Oferta'}</h3>
      <p class="offer-description">${offer.description||''}</p>
      ${offer.original_price?`
        <div class="offer-price">
          <span class="original-price">${offer.original_price}€</span>
          <span class="offer-price-value">${offer.offer_price}€</span>
        </div>`:
        `<div class="offer-price"><span class="offer-price-value">${offer.offer_price?offer.offer_price+'€':'Precio especial'}</span></div>`}
      <p style="color:rgba(139,69,19,.7)"><i class="fas fa-clock" style="color:var(--primary-gold);"></i> Válida ${daysLeft===1?'hasta mañana':`${daysLeft} días más`}</p>
      ${offer.terms?`<div class="offer-terms"><strong>Condiciones</strong><ul style="list-style:none; padding-left:0; margin:.5rem 0 0;">${offer.terms.split('\n').map(t=>t.trim()?`<li>• ${t}</li>`:'').join('')}</ul></div>`:''}
    `;
    return div;
  }
  showEmpty(){ this.loading.style.display='none'; this.offersContainer.style.display='none'; this.emptyState.style.display='block'; }
}

document.addEventListener('DOMContentLoaded', ()=> new OfertasMassa());




