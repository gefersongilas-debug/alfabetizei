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

  const carousels=[...document.querySelectorAll('[data-carousel]')];
  carousels.forEach(carousel=>{
    const viewport=carousel.querySelector('.units-carousel-viewport');
    const track=carousel.querySelector('.units-carousel-track');
    const slides=[...carousel.querySelectorAll('.unit-slide')];
    const prev=carousel.querySelector('.carousel-prev');
    const next=carousel.querySelector('.carousel-next');
    const dotsWrap=carousel.parentElement.querySelector('.carousel-dots');
    if(!viewport||!track||!slides.length||!prev||!next||!dotsWrap)return;
    let index=0;
    let dots=[];
    const slidesPerView=()=>window.innerWidth<=700?1:(window.innerWidth<=1199?2:3);
    const pageCount=()=>Math.max(1,slides.length-slidesPerView()+1);
    const createDots=()=>{
      dotsWrap.innerHTML='';
      dots=Array.from({length:pageCount()},(_,i)=>{
        const btn=document.createElement('button');
        btn.type='button';
        btn.className='carousel-dot';
        btn.setAttribute('aria-label',`Ir para a foto ${i+1}`);
        btn.addEventListener('click',()=>{index=i;update();});
        dotsWrap.appendChild(btn);
        return btn;
      });
    };
    const clampIndex=()=>{index=Math.max(0,Math.min(index,pageCount()-1));};
    const update=()=>{
      clampIndex();
      const gap=parseFloat(getComputedStyle(track).gap)||0;
      const slideWidth=slides[0].getBoundingClientRect().width+gap;
      track.style.transform=`translateX(-${index*slideWidth}px)`;
      prev.disabled=index===0;
      next.disabled=index>=pageCount()-1;
      dots.forEach((dot,i)=>{dot.classList.toggle('is-active',i===index);dot.setAttribute('aria-current',i===index?'true':'false');});
    };
    // Swipe no celular e no tablet sem impedir o scroll vertical da pagina.
    let touchStartX=0;
    let touchStartY=0;
    viewport.addEventListener('touchstart',event=>{
      if(event.touches.length!==1)return;
      touchStartX=event.touches[0].clientX;
      touchStartY=event.touches[0].clientY;
    },{passive:true});
    viewport.addEventListener('touchend',event=>{
      if(!event.changedTouches.length)return;
      const distanceX=event.changedTouches[0].clientX-touchStartX;
      const distanceY=event.changedTouches[0].clientY-touchStartY;
      if(Math.abs(distanceX)>45&&Math.abs(distanceX)>Math.abs(distanceY)*1.2){
        index+=(distanceX<0?1:-1);
        update();
      }
    },{passive:true});
    prev.addEventListener('click',()=>{index-=1;update();});
    next.addEventListener('click',()=>{index+=1;update();});
    let resizeTimer;
    window.addEventListener('resize',()=>{
      clearTimeout(resizeTimer);
      resizeTimer=setTimeout(()=>{
        const expected=pageCount();
        if(dots.length!==expected)createDots();
        update();
      },90);
    });
    createDots();
    update();
  });
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
    ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach(name=>{
      const field=document.getElementById(name);
      if(field)field.value=params.get(name)||'';
    });
    document.getElementById('page_url').value=window.location.href;
    const steps=[...form.querySelectorAll('[data-form-step]')];
    const status=document.getElementById('form-status');
    const progress=document.getElementById('form-progress-fill');
    const stepLabel=document.getElementById('form-step-label');
    const stepName=document.getElementById('form-step-name');
    const showStep=stepNumber=>{
      steps.forEach(step=>{step.hidden=Number(step.dataset.formStep)!==stepNumber;});
      stepLabel.textContent=`Etapa ${stepNumber} de 2`;
      stepName.textContent=stepNumber===1?'Seus dados':'Seu perfil de investimento';
      progress.style.width=stepNumber===1?'50%':'100%';
      status.hidden=true;
    };
    const validateStep=step=>{
      const controls=[...step.querySelectorAll('input[required],select[required]')];
      let firstInvalid=null;
      controls.forEach(el=>{
        const valid=el.checkValidity()&&(el!==tel||el.value.replace(/\D/g,'').length>=10);
        if(!valid){el.setAttribute('aria-invalid','true');if(!firstInvalid)firstInvalid=el;}
        else el.removeAttribute('aria-invalid');
      });
      if(firstInvalid){firstInvalid.focus();firstInvalid.reportValidity();return false;}
      return true;
    };
    const next=document.getElementById('form-next');
    const back=document.getElementById('form-back');
    next.addEventListener('click',()=>{if(validateStep(steps[0]))showStep(2);});
    back.addEventListener('click',()=>showStep(1));
    form.querySelectorAll('input,select').forEach(control=>{
      control.addEventListener('input',()=>control.removeAttribute('aria-invalid'));
      control.addEventListener('change',()=>control.removeAttribute('aria-invalid'));
    });
    form.addEventListener('submit',event=>{
      event.preventDefault();
      if(!validateStep(steps[0])){showStep(1);validateStep(steps[0]);return;}
      if(!validateStep(steps[1]))return;
      status.hidden=false;
      status.textContent='Os dados foram preenchidos, mas o envio ainda não está disponível. A integração com a RD Station precisa ser configurada pela equipe responsável antes da publicação.';
      status.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'});
    });
    showStep(1);
  }
})();
