// Generación de QR por local para sección Ofertas
(function(){
  const API='https://api.qrserver.com/v1/create-qr-code/';
  function qrUrl(data){ return API+`?size=200x200&data=${encodeURIComponent(data)}&bgcolor=FFFFFF&color=2C2C2C&margin=10&ecc=Q`; }
  function init(){
    const nodes=document.querySelectorAll('.qr-code');
    if(!nodes.length) return;
    nodes.forEach(n=>{
      const local=n.getAttribute('data-local');
      const base=location.origin+location.pathname.replace(/index.html?$/,'');
      const url=base+`ofertas/?local=${local}`;
      const img=document.createElement('img');
      img.alt=`QR Ofertas MASSA ${local}`;
      img.style.width='100%'; img.style.height='100%'; img.style.borderRadius='8px';
      img.src=qrUrl(url);
      n.innerHTML=''; n.appendChild(img);
    });
  }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();




