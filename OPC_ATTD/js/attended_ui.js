// Shared presentation primitives. All new terminal actions are browser prototype interactions.
(() => {
    const escape = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const money = cents => '$'+(Math.abs(cents)/100).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
    const icon = name => `<span class="material-symbols-rounded" aria-hidden="true">${name}</span>`;
    const cardBrandAssets = {
            VISA: { src: 'assets/visa.svg', className: 'brand-visa', shortName: 'VISA' },
            MASTERCARD: { src: 'assets/mastercard.svg', className: 'brand-mastercard', shortName: 'MC' },
            AMEX: { src: 'assets/amex.svg', className: 'brand-amex', shortName: 'AMEX' },
            DISCOVER: { src: 'assets/discover.svg', className: 'brand-discover', shortName: 'DISC' },
            JCB: { src: 'assets/jcb.svg', className: 'brand-jcb', shortName: 'JCB' },
            UNIONPAY: { src: 'assets/unionpay.svg', className: 'brand-unionpay', shortName: 'CUP' },
            DINERS: { src: 'assets/diners.svg', className: 'brand-diners', shortName: 'DINERS' },
            MAESTRO: { src: 'assets/maestro-mark.svg', className: 'brand-maestro', shortName: 'MAESTRO' },
            RUPAY: { src: 'assets/rupay.svg', className: 'brand-rupay', shortName: 'RUPAY' },
            INTERAC: { src: 'assets/Interac.png', className: 'brand-interac', shortName: 'INTERAC' },
            ELO: { src: 'assets/elo.svg', className: 'brand-elo', shortName: 'ELO' },
            EFTPOS: { src: 'assets/eftpos.svg', className: 'brand-eftpos', shortName: 'EFTPOS' },
            MIR: { src: 'assets/mir.svg', className: 'brand-mir', shortName: 'MIR' }
        };
    let closeCurrent;
    function modal({title,body='',actions=[],wide=false}) {
        if(closeCurrent) closeCurrent();
        const before=document.activeElement;
        const overlay=document.createElement('div'); overlay.className='attd-modal';
        overlay.innerHTML=`<section class="attd-dialog ${wide?'wide':''}" role="dialog" aria-modal="true" aria-labelledby="attd-dialog-title" tabindex="-1"><h2 id="attd-dialog-title">${escape(title)}</h2><div class="attd-dialog-body">${body}</div><div class="attd-dialog-actions"></div></section>`;
        document.querySelector('.phone-frame').append(overlay);
        const dialog=overlay.firstElementChild;
        const siblings=[...overlay.parentElement.children].filter(n=>n!==overlay&&!n.inert);
        siblings.forEach(n=>n.inert=true);
        function close(){overlay.remove();siblings.forEach(n=>n.inert=false);document.removeEventListener('keydown',keys);if(closeCurrent===close)closeCurrent=null;if(before?.isConnected)before.focus();}
        function keys(e){
            if(e.key==='Escape'){e.preventDefault();close();}
            if(e.key==='Tab') {const items=[...dialog.querySelectorAll('button,input,a[href]')].filter(n=>!n.disabled);const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}
        }
        actions.forEach(a=>{const btn=document.createElement('button');btn.type='button';btn.className='attd-button '+(a.primary?'primary ':'')+(a.danger?'danger':'');btn.textContent=a.label;btn.onclick=()=>{if(a.keepOpen){a.run?.(close,overlay);}else{close();a.run?.();}};overlay.querySelector('.attd-dialog-actions').append(btn);});
        document.addEventListener('keydown',keys);closeCurrent=close;
        (overlay.querySelector('input')||dialog).focus();
        return {close,element:overlay};
    }
    function toast(message){let n=document.querySelector('.attd-toast');if(!n){n=document.createElement('div');n.className='attd-toast';n.setAttribute('role','status');document.querySelector('.phone-frame').append(n);}n.textContent=message;n.hidden=false;setTimeout(()=>n.hidden=true,2200);}
    function pin(action,run){
        const configured=JSON.parse(localStorage.getItem('opc-operation-pins')||'{}')[action];
        if(!configured){run();return;}
        const panel=modal({title:'Enter Manager PIN',body:`<input class="attd-input" id="manager-pin" type="password" inputmode="numeric" autocomplete="off" aria-label="Manager PIN"><p class="attd-error" role="alert"></p>`,actions:[{label:'Cancel'},{label:'Confirm',danger:true,keepOpen:true,run(close,el){if(el.querySelector('input').value!==configured){el.querySelector('.attd-error').textContent='Incorrect PIN. Please try again.';return;}close();run();}}]});
        const input=panel.element.querySelector('input');
        input.addEventListener('keydown',e=>{if(e.key==='Enter')panel.element.querySelector('.attd-dialog-actions button:last-child').click();});
    }
    function details(t,hold=false){return `<dl class="attd-details"><dt>Type</dt><dd>${escape(t.kind==='preauth'?'PreAuth':t.kind==='payment'?'Sale':t.kind)}</dd><dt>${hold?'Current Hold Amount':'Amount'}</dt><dd>${money(Math.round(t.amount*100))}</dd>${!hold&&['payment','capture'].includes(t.kind)&&Number.isSafeInteger(t.transactionAmountCents)?`<dt>Transaction Amount</dt><dd>${money(t.transactionAmountCents)}</dd><dt>Tip</dt><dd>${money(t.tipCents||0)}</dd>`:''}<dt>${t.tenderType==='cash'?'Payment':'Card'}</dt><dd>${t.tenderType==='cash'?'Cash':escape(t.cardType+' ****'+t.lastFour)}</dd><dt>Trace &amp; Time</dt><dd>${escape(t.invoice)} | ${new Date(t.tranTime.replace(' ','T')).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}</dd></dl>`;}
    window.AttendedUI={escape,money,icon,modal,toast,pin,details,cardBrandAssets};
})();
