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

  // Carrossel circular: imagens clonadas nas duas pontas evitam saltos visuais.
  const carousels=[...document.querySelectorAll('[data-carousel]')];
  carousels.forEach(carousel=>{
    const viewport=carousel.querySelector('.units-carousel-viewport');
    const track=carousel.querySelector('.units-carousel-track');
    const prev=carousel.querySelector('.carousel-prev');
    const next=carousel.querySelector('.carousel-next');
    const dotsWrap=carousel.parentElement.querySelector('.carousel-dots');
    if(!viewport||!track||!prev||!next||!dotsWrap)return;
    const originals=[...track.querySelectorAll('.unit-slide')];
    const total=originals.length;
    if(total<2)return;
    const clonesPerSide=Math.min(3,total);
    const cloneSlide=slide=>{
      const clone=slide.cloneNode(true);
      clone.setAttribute('aria-hidden','true');
      clone.setAttribute('inert','');
      clone.classList.add('is-clone');
      return clone;
    };
    const before=originals.slice(-clonesPerSide).map(cloneSlide);
    const after=originals.slice(0,clonesPerSide).map(cloneSlide);
    track.replaceChildren(...before,...originals,...after);
    let index=clonesPerSide;
    let inTransition=false;
    let timer=null;
    let visible=false;
    let hovered=false;
    let focused=false;
    const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
    const dots=originals.map((_,i)=>{
      const dot=document.createElement('button');
      dot.type='button';
      dot.className='carousel-dot';
      dot.setAttribute('aria-label',`Mostrar foto ${i+1} de ${total}`);
      dot.addEventListener('click',()=>{
        if(inTransition)return;
        moveTo(clonesPerSide+i);
      });
      dotsWrap.appendChild(dot);
      return dot;
    });
    const activeIndex=()=>((index-clonesPerSide)%total+total)%total;
    const position=()=>{
      const gap=parseFloat(getComputedStyle(track).columnGap)||0;
      return index*(originals[0].getBoundingClientRect().width+gap);
    };
    const paint=()=>{
      track.style.transform=`translate3d(-${position()}px,0,0)`;
      dots.forEach((dot,i)=>{
        const active=i===activeIndex();
        dot.classList.toggle('is-active',active);
        dot.setAttribute('aria-current',active?'true':'false');
      });
    };
    const immediate=()=>{
      track.style.transition='none';
      paint();
      // força o navegador a aplicar o reposicionamento sem transição.
      void track.offsetWidth;
      track.style.transition='';
    };
    const canPlay=()=>visible&&!hovered&&!focused&&!reducedMotion.matches&&!document.hidden;
    const stopAuto=()=>{if(timer!==null){clearTimeout(timer);timer=null;}};
    const planAuto=()=>{
      stopAuto();
      if(canPlay())timer=setTimeout(()=>moveTo(index+1),4800);
    };
    const settle=()=>{
      inTransition=false;
      if(index<clonesPerSide){index+=total;immediate();}
      else if(index>=clonesPerSide+total){index-=total;immediate();}
      planAuto();
    };
    const moveTo=target=>{
      if(inTransition)return;
      stopAuto();
      if(target===index){planAuto();return;}
      if(reducedMotion.matches){
        index=target;
        if(index<clonesPerSide)index+=total;
        else if(index>=clonesPerSide+total)index-=total;
        immediate();planAuto();return;
      }
      inTransition=true;
      index=target;
      paint();
    };
    track.addEventListener('transitionend',event=>{
      if(event.target===track&&event.propertyName==='transform'&&inTransition)settle();
    });
    prev.addEventListener('click',()=>moveTo(index-1));
    next.addEventListener('click',()=>moveTo(index+1));
    let touchX=0,touchY=0;
    viewport.addEventListener('touchstart',event=>{
      if(event.touches.length!==1)return;
      touchX=event.touches[0].clientX;
      touchY=event.touches[0].clientY;
    },{passive:true});
    viewport.addEventListener('touchend',event=>{
      if(!event.changedTouches.length)return;
      const deltaX=event.changedTouches[0].clientX-touchX;
      const deltaY=event.changedTouches[0].clientY-touchY;
      if(Math.abs(deltaX)>45&&Math.abs(deltaX)>Math.abs(deltaY)*1.2)
        moveTo(index+(deltaX<0?1:-1));
    },{passive:true});
    carousel.addEventListener('mouseenter',()=>{hovered=true;stopAuto();});
    carousel.addEventListener('mouseleave',()=>{hovered=false;planAuto();});
    carousel.addEventListener('focusin',()=>{focused=true;stopAuto();});
    carousel.addEventListener('focusout',event=>{
      if(!carousel.contains(event.relatedTarget)){focused=false;planAuto();}
    });
    document.addEventListener('visibilitychange',planAuto);
    reducedMotion.addEventListener('change',planAuto);
    let resizeRaf=0;
    window.addEventListener('resize',()=>{
      cancelAnimationFrame(resizeRaf);
      resizeRaf=requestAnimationFrame(()=>{
        inTransition=false;
        if(index<clonesPerSide)index+=total;
        if(index>=clonesPerSide+total)index-=total;
        immediate();planAuto();
      });
    });
    if('IntersectionObserver' in window){
      const visibilityObserver=new IntersectionObserver(entries=>{
        visible=entries[0].isIntersecting;
        planAuto();
      },{threshold:0.15});
      visibilityObserver.observe(carousel);
    }else{visible=true;}
    // Inicializa nas fotos reais 1, 2 e 3; clones só aparecem durante o loop.
    immediate();
    planAuto();
  });

  // Entradas discretas, disparadas somente quando a seção entra no viewport.
  // Sem JS / IntersectionObserver / permissão de movimento, o conteúdo segue visível.
  const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');
  if('IntersectionObserver' in window&&!motionPreference.matches){
    const groups=[
      '.hero-copy > .eyebrow,.hero h1,.hero-copy > p,.hero-pills,.hero-actions,.hero-visual',
      '.numbers-grid > *, .numbers-note',
      '.personas-section .section-heading > *, .personas-grid > *',
      '.differentials-section .section-heading > *, .differentials-grid > *, .differentials-action',
      '.units-section .section-heading > *, .units-carousel, .units-section .carousel-dots',
      '.faq-section .section-heading > *, .faq-list > *',
      '.authority-image, .authority-copy > *',
      '.contact-copy > *, .form-card',
      '.footer-inner > *'
    ];
    const revealObserver=new IntersectionObserver(entries=>{
      for(const entry of entries){
        if(entry.isIntersecting){
          entry.target.classList.add('is-revealed');
          revealObserver.unobserve(entry.target);
        }
      }
    },{rootMargin:'0px 0px -6% 0px',threshold:0.07});
    groups.forEach(selectors=>{
      document.querySelectorAll(selectors).forEach((element,i)=>{
        element.classList.add('reveal-on-scroll');
        element.style.setProperty('--entrance-delay',`${Math.min(i%4,3)*90}ms`);
        revealObserver.observe(element);
      });
    });
    // O modo animado só é ligado após registrar os elementos no observador.
    document.documentElement.classList.add('motion-ready');
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
