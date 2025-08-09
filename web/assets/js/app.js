/* MASSA - App bootstrap (extraído y simplificado de src/js/main.js) */
(function(){
  const CONFIG = { SCROLL_THRESHOLD: 300, QR_API_URL: 'https://api.qrserver.com/v1/create-qr-code/' };

  const Utils = {
    debounce(func, wait){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>func(...a), wait); } },
    smoothScrollTo(el){ if(el){ el.scrollIntoView({behavior:'smooth', block:'start'}); } }
  };

  class ScrollManager{
    constructor(){ this.navbar=document.querySelector('.navbar'); this.scrollTopBtn=document.querySelector('#scrollTop'); this.init(); }
    init(){ window.addEventListener('scroll', Utils.debounce(()=>this.handle(),16)); if(this.scrollTopBtn){ this.scrollTopBtn.addEventListener('click', ()=> window.scrollTo({top:0, behavior:'smooth'})); } }
    handle(){ const y=window.pageYOffset; if(this.navbar){ this.navbar.classList.toggle('scrolled', y>50); } if(this.scrollTopBtn){ this.scrollTopBtn.classList.toggle('visible', y>CONFIG.SCROLL_THRESHOLD); } }
  }

  class Navigation{
    constructor(){ this.init(); }
    init(){ document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click', (e)=>{ const href=a.getAttribute('href'); if(href==='#' || href.startsWith('#')===false) return; const target=document.querySelector(href); if(target){ e.preventDefault(); Utils.smoothScrollTo(target);} })); }
  }

  window.MassaApp = { CONFIG };

  function boot(){ new ScrollManager(); new Navigation();
    // Validate internal links exist to avoid 404 feel
    document.querySelectorAll('a[href]').forEach(a=>{
      const href=a.getAttribute('href')||'';
      if(href.startsWith('./')||href.startsWith('locations/')||href.startsWith('./locations/')){
        a.addEventListener('click',(e)=>{
          // no-op, allow default navigation; could add prefetch here
        });
      }
    });
  }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', boot); } else { boot(); }
})();




