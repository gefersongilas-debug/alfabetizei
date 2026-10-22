'use strict';
(() => {
  const menuButton=document.querySelector('.menu-toggle');
  const menu=document.querySelector('.site-nav');
  if(menuButton&&menu){
    const closeMenu=()=>{menu.classList.remove('is-visible');menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Abrir menu');};
    menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';menu.classList.toggle('is-visible',open);menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');});
    menu.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.classList.contains('is-visible')){closeMenu();menuButton.focus();}});
    document.addEventListener('click',e=>{if(!menu.contains(e.target)&&!menuButton.contains(e.target))closeMenu();});
    window.addEventListener('resize',()=>{if(window.innerWidth>900)closeMenu();});
  }
  const faqs=[...document.querySelectorAll('.faq-item')];
  faqs.forEach(item=>{
    const btn=item.querySelector('.faq-trigger');const panel=item.querySelector('.faq-answer');
    btn.addEventListener('click',()=>{
      const wasOpen=item.classList.contains('is-open');
      faqs.forEach(f=>{f.classList.remove('is-open');f.querySelector('.faq-trigger').setAttribute('aria-expanded','false');f.querySelector('.faq-answer').setAttribute('inert','');});
      if(!wasOpen){item.classList.add('is-open');btn.setAttribute('aria-expanded','true');panel.removeAttribute('inert');}
    });
  });
  const tel=document.getElementById('telefone');
  if(tel){tel.addEventListener('input',()=>{const digits=tel.value.replace(/\D/g,'').slice(0,11);let formatted=digits;if(digits.length>2){formatted=`(${digits.slice(0,2)}) ${digits.slice(2)}`;}if(digits.length>7){const cut=digits.length===11?7:6;formatted=`(${digits.slice(0,2)}) ${digits.slice(2,cut)}-${digits.slice(cut)}`;}tel.value=formatted;});}
  const form=document.getElementById('lead-form');
  if(form){
    const params=new URLSearchParams(window.location.search);
    ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach(name=>{const field=document.getElementById(name);if(field)field.value=params.get(name)||'';});
    document.getElementById('page_url').value=window.location.href;
    form.addEventListener('submit',event=>{
      event.preventDefault();
      form.querySelectorAll('[aria-invalid]').forEach(x=>x.removeAttribute('aria-invalid'));
      const controls=[...form.querySelectorAll('input[required],select[required]')];
      const invalid=controls.find(el=>{const ok=el.checkValidity() && (el!==tel || el.value.replace(/\D/g,'').length>=10);if(!ok)el.setAttribute('aria-invalid','true');return !ok;});
      if(invalid){invalid.focus();invalid.reportValidity();return;}
      const status=document.getElementById('form-status');
      status.hidden=false;
      status.textContent='Os dados foram preenchidos, mas o envio ainda não está disponível. A integração com a RD Station precisa ser configurada pela equipe responsável antes da publicação.';
      status.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'});
    });
  }
})();
