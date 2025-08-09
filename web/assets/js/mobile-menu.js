// Copia simplificada del menú móvil para MASSA
(function(){
  class MobileMenu {
    constructor(){
      this.btn=document.getElementById('mobile-menu');
      this.overlay=document.getElementById('mobile-menu-overlay');
      this.closeBtn=document.getElementById('mobile-menu-close');
      this.links=document.querySelectorAll('.mobile-nav-links a');
      this.isOpen=false;
      this.init();
    }
    init(){ if(!this.btn||!this.overlay) return; 
      this.btn.addEventListener('click', (e)=>{ e.preventDefault(); this.open(); });
      if(this.closeBtn){ this.closeBtn.addEventListener('click', (e)=>{ e.preventDefault(); this.close(); }); }
      this.overlay.addEventListener('click', (e)=>{ if(e.target===this.overlay) this.close(); });
      this.links.forEach(l=>l.addEventListener('click', ()=> this.close()));
      document.addEventListener('keydown',(e)=>{ if(e.key==='Escape'&&this.isOpen) this.close(); });
    }
    open(){ if(this.isOpen) return; this.isOpen=true; document.body.classList.add('no-scroll'); this.overlay.classList.add('active'); this.overlay.setAttribute('aria-hidden','false'); this.btn.setAttribute('aria-expanded','true'); }
    close(){ if(!this.isOpen) return; this.isOpen=false; this.overlay.classList.remove('active'); document.body.classList.remove('no-scroll'); this.overlay.setAttribute('aria-hidden','true'); this.btn.setAttribute('aria-expanded','false'); }
  }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', ()=> window.mobileMenu=new MobileMenu()); } else { window.mobileMenu=new MobileMenu(); }
})();




