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
  // Integração do formulário Alfabetizei com o cenário Make.
  // Não envie PII (nome, email, telefone) ao dataLayer do Google Tag Manager.
  const form=document.getElementById('lead-form');
  if(form){
    const WEBHOOK_URL='https://hook.us1.make.celonis.com/kwypcteqviy96ygpb7804tw5rc49dfi2';
    const FORM_ID='lead-form';
    const FORM_NAME='franquia_alfabetizei';
    const pushEvent=(name,info={})=>{
      window.dataLayer=window.dataLayer||[];
      window.dataLayer.push({event:name,form_id:FORM_ID,form_name:FORM_NAME,...info});
    };
    // Captura cliques nos CTAs de navegação sem transmitir dados pessoais ao GTM.
    document.querySelectorAll('a.btn[href]').forEach(link=>{
      link.addEventListener('click',()=>pushEvent('cta_click',{
        cta_text:link.textContent.trim(),
        cta_target:link.getAttribute('href')||''
      }));
    });
    const qs=new URLSearchParams(window.location.search);
    const attributionKeys=[
      'utm_source','utm_medium','utm_campaign','utm_content','utm_term',
      'utm_id','utm_source_platform','utm_creative_format','utm_marketing_tactic',
      'gclid','gbraid','wbraid','fbclid','msclkid','ttclid','li_fat_id'
    ];
    // Preserva origem da primeira visita durante a navegação na mesma aba.
    const storeKey='alfabetizei_attribution_v1';
    let saved={};
    try{saved=JSON.parse(sessionStorage.getItem(storeKey)||'{}')||{};}catch(_e){saved={};}
    const newAttribution=attributionKeys.some(key=>qs.has(key));
    if(newAttribution){
      attributionKeys.forEach(key=>{saved[key]=qs.get(key)||'';});
      saved.landing_page=window.location.href;
      saved.page_referrer=document.referrer||'';
    }else{
      attributionKeys.forEach(key=>{if(!(key in saved))saved[key]='';});
      if(!saved.landing_page)saved.landing_page=window.location.href;
      if(!('page_referrer' in saved))saved.page_referrer=document.referrer||'';
    }
    try{sessionStorage.setItem(storeKey,JSON.stringify(saved));}catch(_e){}
    const setHidden=(name,value)=>{const input=form.elements.namedItem(name);if(input)input.value=String(value??'');};
    attributionKeys.forEach(key=>setHidden(key,saved[key]));
    setHidden('landing_page',saved.landing_page);
    setHidden('page_referrer',saved.page_referrer);
    setHidden('page_url',window.location.href);
    setHidden('page_path',window.location.pathname);
    setHidden('page_title',document.title);

    const steps=[...form.querySelectorAll('[data-form-step]')];
    const status=document.getElementById('form-status');
    const progress=document.getElementById('form-progress-fill');
    const progressBlock=form.querySelector('.form-progress');
    const stepLabel=document.getElementById('form-step-label');
    const stepName=document.getElementById('form-step-name');
    const next=document.getElementById('form-next');
    const back=document.getElementById('form-back');
    const submitButton=form.querySelector('button[type="submit"]');
    const tel=document.getElementById('telefone');
    let submitting=false;
    let started=false;

    const showStatus=(message,state)=>{
      status.hidden=false;
      status.dataset.state=state;
      status.textContent=message;
      if(state==='success'||state==='error')status.scrollIntoView({behavior:'smooth',block:'nearest'});
    };
    const showStep=stepNumber=>{
      steps.forEach(step=>{step.hidden=Number(step.dataset.formStep)!==stepNumber;});
      stepLabel.textContent=`Etapa ${stepNumber} de 2`;
      stepName.textContent=stepNumber===1?'Seus dados':'Seu perfil de investimento';
      progress.style.width=stepNumber===1?'50%':'100%';
      status.hidden=true;
      status.removeAttribute('data-state');
    };
    const validateStep=step=>{
      const controls=[...step.querySelectorAll('input[required],select[required]')];
      let firstInvalid=null;
      controls.forEach(el=>{
        if(el.tagName==='INPUT'&&el.type==='text')el.value=el.value.trim();
        if(el.tagName==='INPUT'&&el.type==='email')el.value=el.value.trim();
        const valid=el.checkValidity()&&(el!==tel||el.value.replace(/\D/g,'').length>=10);
        if(!valid){el.setAttribute('aria-invalid','true');if(!firstInvalid)firstInvalid=el;}
        else el.removeAttribute('aria-invalid');
      });
      if(firstInvalid){firstInvalid.focus();firstInvalid.reportValidity();return false;}
      return true;
    };
    const getDeviceType=()=>{
      const width=window.innerWidth;
      return width<=767?'mobile':width<=1024?'tablet':'desktop';
    };
    const makePayload=()=>{
      const payload=Object.fromEntries(new FormData(form).entries());
      const timestamp=new Date().toISOString();
      const digits=String(payload.telefone||'').replace(/\D/g,'');
      const uuid=(window.crypto&&typeof window.crypto.randomUUID==='function')
        ?window.crypto.randomUUID():`lead-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
      return {
        ...payload,
        telefone_limpo:digits,
        telefone_e164:digits.length>=10&&digits.length<=11?`+55${digits}`:'',
        site_name:'Alfabetizei',
        site_slug:'alfabetizei',
        origem:'lp_alfabetizei',
        form_id:FORM_ID,
        form_name:FORM_NAME,
        lead_id:uuid,
        submitted_at:timestamp,
        data_envio:timestamp,
        page_url:window.location.href,
        page_path:window.location.pathname,
        page_title:document.title,
        pagina:window.location.href,
        user_agent:navigator.userAgent,
        browser_language:navigator.language||'',
        device_type:getDeviceType(),
        screen_resolution:`${window.screen.width}x${window.screen.height}`
      };
    };

    next.addEventListener('click',()=>{
      if(!validateStep(steps[0]))return;
      showStep(2);
      pushEvent('form_step_2',{form_step:2});
    });
    back.addEventListener('click',()=>showStep(1));
    form.querySelectorAll('input,select').forEach(control=>{
      if(control.type==='hidden')return;
      control.addEventListener('focus',()=>{
        if(started)return;
        started=true;
        pushEvent('form_start',{form_step:1});
      });
      control.addEventListener('input',()=>control.removeAttribute('aria-invalid'));
      control.addEventListener('change',()=>control.removeAttribute('aria-invalid'));
    });
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      if(submitting)return;
      if(!validateStep(steps[0])){showStep(1);validateStep(steps[0]);return;}
      if(!validateStep(steps[1]))return;
      submitting=true;
      submitButton.disabled=true;
      submitButton.setAttribute('aria-busy','true');
      const initialLabel=submitButton.textContent;
      submitButton.textContent='Enviando...';
      status.hidden=true;
      const payload=makePayload();
      pushEvent('form_submit_attempt',{form_step:2,lead_id:payload.lead_id});
      try{
        // URLSearchParams usa formulário simples: Make lê todos os campos, sem preflight JSON.
        // Nunca faça um segundo POST automático após falha de CORS (poderia duplicar o lead).
        const response=await fetch(WEBHOOK_URL,{
          method:'POST',
          mode:'cors',
          cache:'no-store',
          body:new URLSearchParams(Object.entries(payload).map(([key,value])=>[key,String(value??'')]))
        });
        if(!response.ok)throw new Error(`HTTP ${response.status}`);
        // O HTTP 2xx confirma aceite pelo webhook, não as etapas seguintes do cenário.
        pushEvent('generate_lead',{lead_id:payload.lead_id,form_step:2,lead_status:'webhook_accepted'});
        steps.forEach(step=>{step.hidden=true;});
        progressBlock.hidden=true;
        showStatus('Solicitação enviada com sucesso! Nossa equipe entrará em contato em breve.','success');
      }catch(error){
        console.error('Falha ou resposta não confirmada do webhook:',error);
        pushEvent('form_submit_error',{lead_id:payload.lead_id,form_step:2,lead_status:'not_confirmed'});
        showStatus('Não foi possível confirmar o envio. Verifique sua conexão. Se o problema continuar, nossa equipe poderá conferir o recebimento no Make.','error');
        submitButton.disabled=false;
      }finally{
        submitting=false;
        submitButton.removeAttribute('aria-busy');
        submitButton.textContent=initialLabel;
      }
    });
    showStep(1);
  }
})();
