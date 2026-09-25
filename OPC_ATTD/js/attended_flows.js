(() => {
    const ui=AttendedUI, demo=AttendedDemo;
    let action='', selected=null, mode='methods', lookupValue='', flow;
    const params=new URLSearchParams(location.search);
    function removeFlow(){flow?.remove();flow=null;}
    function cardTitle(t){return t.kind==='preauth'?'PreAuth':t.kind==='payment'?'Sale':t.kind==='capture'?'Capture':'Refund';}
    function goList(){location.href='transactions.html?'+new URLSearchParams({action,from:'lookup'});}
    function select(t){
        if(!t)return;
        const title=action==='Void'?'Void':action==='Reprint'?'Print Transaction?':`Perform ${action==='Auth-Incremental'?'Auth Incremental':'Capture'}?`;
        ui.modal({title,body:ui.details(t,action==='Auth-Incremental'),actions:[{label:action==='Void'?'NO':'Cancel'},{label:action==='Void'?'YES':action==='Reprint'?'Print':action==='Auth-Incremental'?'Auth Incremental':'Capture',primary:true,run(){
            selected=t;
            if(action==='Reprint'){print(t);return;}
            if(action==='Void'){finish(action,Math.round(Math.abs(t.amount)*100));return;}
            removeFlow();resetTransactionAmount(action);showAppView('home');refreshAmount();
        }}]});
    }
    async function print(t){
        const methods=['reprintByReceiptNo','printReceiptByReceiptNo','reprintReceipt'];
        const bridges=[window,...['PaywizardTerminal','PayWizardTerminal','paywizardTerminal','TerminalBridge','NativeBridge','Android','android'].map(k=>window[k]).filter(Boolean)];
        try {
            let handled=false;
            for(const bridge of bridges){
                for(const name of methods){if(typeof bridge[name]==='function'){await bridge[name](t.invoice);handled=true;break;}}
                if(handled)break;
            }
            window.dispatchEvent(new CustomEvent('attended-reprint',{detail:{...t}}));
            ui.toast('Receipt sent to printer');
        } catch(error) { ui.toast(error.message||'Unable to print this receipt.'); }
    }
    function choose(matches){
        if(!matches.length){const error=flow?.querySelector('.attd-error');if(error)error.textContent='No matching transactions.';else ui.toast('No matching transactions.');return;}
        if(matches.length===1){select(matches[0]);return;}
        const card=matches[0].tenderType==='cash'?'Cash':`${matches[0].cardType} ****${matches[0].lastFour}`;
        const dialog=ui.modal({title:`Found ${matches.length} Transactions for ${card}`,body:`<div class="attd-matches">${matches.map((t,i)=>`<button class="attd-match" data-match="${i}"><span><small>${new Date(t.tranTime.replace(' ','T')).toLocaleDateString('en-US')}</small>${new Date(t.tranTime.replace(' ','T')).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}<small>${ui.escape(t.invoice)}</small></span><strong>${ui.money(Math.round(t.amount*100))}</strong><span>${cardTitle(t)}</span></button>`).join('')}</div>`,actions:[{label:'NO'}]});
        dialog.element.querySelectorAll('[data-match]').forEach(b=>b.onclick=()=>{dialog.close();select(matches[Number(b.dataset.match)]);});
    }
    function lookup(){const matches=demo.eligible(action).filter(t=>lookupValue.length===4?t.lastFour===lookupValue:t.invoice===lookupValue);choose(matches);}
    function tap(){
        const dialog=ui.modal({title:'Tap Card to Find',body:`<p>Present the card used for the original transaction.</p><button class="attd-choice full" id="sample-card">${ui.icon('contactless')}VISA ••••0100</button>`,actions:[{label:'Cancel'}]});
        dialog.element.querySelector('#sample-card').onclick=()=>{dialog.close();choose(demo.eligible(action).filter(t=>t.lastFour==='0100'));};
    }
    function entry(){mode='entry';lookupValue='';render();}
    function key(value){lookupValue=value==='BS'?lookupValue.slice(0,-1):value==='C'?'':(lookupValue+value).slice(0,12);flow.querySelector('input').value=lookupValue;flow.querySelector('.attd-error').textContent='';}
    function render(){
        removeFlow();flow=document.createElement('section');flow.className='attd-flow';flow.setAttribute('aria-label',`${action} lookup`);
        const title=mode==='entry'?'Input Receipt No.':action==='Reprint'?'Print':action;
        flow.innerHTML=`<div class="attd-flow-header"><button class="attd-back" aria-label="Back from lookup">${ui.icon('chevron_left')}</button><h2>${title}</h2>${action==='Void'?'<button class="attd-button primary quick-void">Quick Void Last</button>':''}</div>`;
        document.querySelector('.phone-frame').append(flow);
        flow.querySelector('.attd-back').onclick=()=>{if(mode==='entry'&&action!=='Void'){mode='methods';render();}else{removeFlow();showAppView('transactions');}};
        if(action==='Void'){const quick=flow.querySelector('.quick-void');quick.disabled=!demo.eligible('Void').length;quick.onclick=()=>select(demo.eligible('Void')[0]);}
        if(mode==='entry'){
            flow.insertAdjacentHTML('beforeend',`<label class="attd-lookup-label" for="lookup-value">RECEIPT NO. OR CARD LAST 4 DIGITS</label><input id="lookup-value" class="attd-input attd-lookup-input" inputmode="numeric" maxlength="12" autocomplete="off"><div class="attd-error" role="alert"></div><div class="key-grid">${['7','8','9','BS','4','5','6','C','1','2','3','OK','0','00'].map(v=>`<button type="button" data-key="${v}" class="key key-${({BS:'del',C:'clear',OK:'ok'})[v]||v} ${v==='OK'?'key-done':v==='BS'?'key-delete':''}">${v==='BS'?ui.icon('backspace'):v}</button>`).join('')}</div>`);
            flow.querySelector('input').oninput=e=>{lookupValue=e.target.value.replace(/\D/g,'');e.target.value=lookupValue;};
            flow.querySelector('input').onkeydown=e=>{if(e.key==='Enter')lookup();};
            flow.querySelectorAll('[data-key]').forEach(b=>b.onclick=()=>b.dataset.key==='OK'?lookup():key(b.dataset.key));
            return;
        }
        if(action==='Reprint'){
            const last=demo.rows()[0];
            flow.insertAdjacentHTML('beforeend',`<button class="attd-choice full last-print">${ui.icon('print')}Print Last Transaction<small>${cardTitle(last)} | ${ui.money(Math.round(last.amount*100))} | ${ui.escape(last.cardType+' ****'+last.lastFour)} | ${new Date(last.tranTime.replace(' ','T')).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}</small></button><div class="attd-divider">Reprint Old Receipt</div>`);
            flow.querySelector('.last-print').onclick=()=>ui.modal({title:'Print Last Transaction?',body:ui.details(last),actions:[{label:'Cancel'},{label:'Print',primary:true,run:()=>print(last)}]});
        }
        flow.insertAdjacentHTML('beforeend',`<div class="attd-choice-grid"><button class="attd-choice find-card">${ui.icon('credit_card')}Tap Card to Find${action==='Reprint'?'':' PreAuth'}</button><button class="attd-choice find-receipt">${ui.icon('keyboard')}Enter Receipt #</button></div><div class="attd-divider">OR</div><button class="attd-choice full find-list">${ui.icon('receipt_long')}Search in Transactions List<small>${action==='Reprint'?'Browse past sales, voids, and refunds to reprint':'Browse past PreAuth transactions'}</small></button>`);
        flow.querySelector('.find-card').onclick=tap;flow.querySelector('.find-receipt').onclick=entry;flow.querySelector('.find-list').onclick=goList;
    }
    function begin(name){action=name;selected=null;resetTransactionAmount(null);showAppView('transactions');mode=action==='Void'?'entry':'methods';render();}
    function finish(name,cents){
        const p=new URLSearchParams({transactionType:name,amountCents:String(cents),paymentMethod:selected?.tenderType||'card',cardBrand:selected?.cardType||'VISA',last4:selected?.lastFour||'0100',transactionNo:String(Date.now()).slice(-6),operationId:crypto.randomUUID()});
        if(selected)p.set('sourceId',selected.id);
        if(name==='Void'||name==='Auth-Incremental')p.set('signature','false');
        window.MerchantContext?.appendTo(p);location.href='receipt.html?'+p;
    }
    function submit(name,cents){
        if(name==='Auth')name='PreAuth';
        if(!['PreAuth','Auth-Incremental','Capture'].includes(name))return false;
        if(name==='Capture'&&selected&&cents>Math.round(selected.amount*100)){
            ui.modal({title:'⚠ Capture Amount Exceeds Hold',body:`<p>The capture amount exceeds the current hold amount. Do you want to continue?</p><p><strong>Max Allowed Capture: ${ui.money(Math.round(selected.amount*100))}</strong></p><strong>Capture Amount: ${ui.money(cents)}</strong>`,actions:[{label:'Cancel'},{label:'Confirm Capture',primary:true,run:()=>finish(name,cents)}]});
        }else finish(name,cents);
        return true;
    }
    function refreshAmount(){
        const isRefund=pendingAction==='Refund',cents=Number(rawAmount)||0;
        document.querySelector('.amount-display .currency').textContent=isRefund?'- $':'$';
        const ok=document.querySelector('#keypad-overlay .key-ok');ok.disabled=cents===0;ok.innerHTML=`OK<small>(${isRefund?'- ':''}${ui.money(cents)})</small>`;
        const hold=document.getElementById('attd-hold');
        const hasHold=selected&&['Auth-Incremental','Capture'].includes(pendingAction);hold.hidden=!hasHold;
        if(hasHold){const current=Math.round(selected.amount*100);hold.innerHTML=pendingAction==='Capture'?`<div>Original Hold Amount: ${ui.money(current)}</div><div>Max Allowed Capture: ${ui.money(current)}</div>`:`<div>Current Hold Amount: ${ui.money(current)}</div><div>New Total Hold Amount: ${ui.money(current+cents)}</div>`;}
        document.getElementById('attd-entry-back').hidden=!pendingAction;
    }
    window.AttendedFlows={begin,submit,refreshAmount,removeFlow};
    document.addEventListener('DOMContentLoaded',()=>{
        const grid=document.getElementById('grid-card');
        const extras=document.createElement('details');extras.className='attd-extra';extras.innerHTML='<summary>More operations</summary><div class="attd-extra-grid"></div>';
        grid.querySelectorAll(':scope > .action-card').forEach(card=>{
            const label=card.querySelector('.card-label');
            if(label.textContent.trim()==='Credit Sale')label.textContent='Sale';
            if(label.textContent.trim()==='Auth')label.textContent='PreAuth';
            if(card.getAttribute('onclick').includes('Auth-Incremental'))card.classList.add('attd-incremental');
            if(card.getAttribute('onclick').includes("'Capture'"))card.classList.add('attd-capture');
            if(/Debit|Tip Adjust/.test(label.textContent))extras.lastElementChild.append(card);
        });grid.append(extras);
        const back=document.createElement('button');back.id='attd-entry-back';back.className='attd-back attd-entry-back';back.setAttribute('aria-label','Back to operations');back.innerHTML=ui.icon('chevron_left');back.onclick=()=>{resetTransactionAmount(null);showAppView('transactions');};document.querySelector('.header').append(back);
        const hold=document.createElement('div');hold.id='attd-hold';hold.className='attd-hold';document.getElementById('amount-entry-state').append(hold);
        const section=document.createElement('section');section.className='attd-pin-settings';
        section.innerHTML='<strong>Operation PINs</strong><small>Leave blank to disable a PIN.</small>'+['Void','Refund','Close Batch'].map(n=>`<label>${n}<input type="password" inputmode="numeric" class="attd-input" data-pin="${n}" aria-label="${n} PIN" autocomplete="off"></label>`).join('');
        const config=JSON.parse(localStorage.getItem('opc-operation-pins')||'{}');section.querySelectorAll('input').forEach(input=>{input.value=config[input.dataset.pin]||'';input.oninput=()=>{input.value=input.value.replace(/\D/g,'');config[input.dataset.pin]=input.value;localStorage.setItem('opc-operation-pins',JSON.stringify(config));};});document.querySelector('.settings-list').append(section);
        refreshAmount();
        const returning=params.get('action');
        if(returning&&['Auth-Incremental','Capture','Reprint','Void'].includes(returning)){
            begin(returning);const t=demo.find(params.get('selected'));if(t)select(t);
        } else if(params.get('view')==='transactions')showAppView('transactions');
    });
})();
