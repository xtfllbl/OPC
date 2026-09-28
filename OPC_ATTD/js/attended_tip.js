// Current-batch Tip Adjust, using the cashier keypad and shared Transactions styles.
(() => {
    const ui=AttendedUI,demo=AttendedDemo;
    let screen,siblings=[],returnToBatch=false,filter='all',query='',searchOpen=false;
    let selected=null,queue=[],position=0,draft=0,original=0,replaceOnDigit=true;
    const labels={all:'All',pending:'Unadjusted',adjusted:'Adjusted'};
    function eligible(){return demo.eligible('Tip Adjust').sort((a,b)=>b.tranTime.localeCompare(a.tranTime)||b.invoice.localeCompare(a.invoice));}
    function matches(){return eligible().filter(t=>(filter==='all'||(filter==='pending'?!t.tipConfirmedAt:!!t.tipConfirmedAt))&&`${t.invoice} ${t.lastFour}`.includes(query.trim()));}
    function header(title,extra=''){return `<header class="app-header"><div class="left"><button class="back-btn" aria-label="Back">${ui.icon('chevron_left')}</button></div><h2 class="title">${title}</h2><div class="right">${extra}</div></header>`;}
    function exit(){
        screen?.remove();screen=null;siblings.forEach(n=>n.inert=false);siblings=[];
        document.removeEventListener('keydown',keys);window.removeEventListener('beforeunload',beforeUnload);
        if(returnToBatch){location.href='batch_reports.html?mode=close';return;}
        showAppView('transactions');document.querySelector('[onclick="doAction(\'Tip Adjust\')"]')?.focus();
    }
    function dirty(){return selected&&draft!==original;}
    function leave(run){if(!dirty()){run();return;}ui.modal({title:'Discard Tip Changes?',body:'<p>This tip has not been saved.</p>',actions:[{label:'Keep Editing',primary:true},{label:'Discard Changes',run}]});}
    function beforeUnload(e){if(dirty()){e.preventDefault();e.returnValue='';}}
    function list(){
        selected=null;
        screen.classList.remove('attd-tip-editor');
        screen.innerHTML=header('Tip Adjust',`<button class="icon-btn" aria-label="Search transactions" aria-expanded="${searchOpen}">${ui.icon('search')}</button><div class="filter-wrap"><button class="icon-btn" aria-label="Filter transactions" aria-expanded="false">${ui.icon('filter_list')}</button><div class="filter-menu">${Object.entries(labels).map(([key,label])=>`<button class="filter-item ${key===filter?'active':''}" data-filter="${key}">${label}</button>`).join('')}</div></div>`)+
            `<div class="toolbar"><span class="filter-chip">${labels[filter]}</span><span class="count-text"></span></div><div class="search-wrap ${searchOpen?'open':''}"><input class="search-input" aria-label="Receipt number or card last 4" placeholder="Receipt # or card last 4" value="${ui.escape(query)}"></div><div class="attd-tip-summary"></div><div class="table-head"><span>Time / Receipt</span><span>Card / Type</span><span>Total / Tip</span></div><div class="tx-list"></div><footer class="attd-tip-footer"><button class="attd-button" data-done>${returnToBatch?'Back to Close Batch':'Done'}</button></footer>`;
        screen.querySelector('.back-btn').onclick=exit;screen.querySelector('[data-done]').onclick=exit;
        screen.querySelector('[aria-label="Search transactions"]').onclick=e=>{searchOpen=!searchOpen;screen.querySelector('.search-wrap').classList.toggle('open',searchOpen);e.currentTarget.setAttribute('aria-expanded',searchOpen);if(searchOpen)screen.querySelector('input').focus();else{query='';screen.querySelector('input').value='';renderRows();}};
        screen.querySelector('[aria-label="Filter transactions"]').onclick=e=>{const open=screen.querySelector('.filter-menu').classList.toggle('open');e.currentTarget.setAttribute('aria-expanded',open);};
        screen.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;list();});
        screen.querySelector('input').oninput=e=>{query=e.target.value;renderRows();};
        renderRows();screen.querySelector('.back-btn').focus();
    }
    function renderRows(){
        const all=eligible(),rows=matches();
        screen.querySelector('.count-text').textContent=`${rows.length} transaction${rows.length===1?'':'s'}`;
        screen.querySelector('.attd-tip-summary').innerHTML=`<span>Batch #${ui.escape(demo.toBatch('current').summary.batchId)} · ${all.filter(t=>!t.tipConfirmedAt).length} unadjusted</span><span>Tips <strong>${ui.money(all.reduce((sum,t)=>sum+t.tipCents,0))}</strong></span>`;
        screen.querySelector('.tx-list').innerHTML=rows.length?rows.map(t=>{
            const time=new Date(t.tranTime.replace(' ','T'));
            return `<button class="tx-row" data-id="${ui.escape(t.id)}" aria-label="Adjust tip for receipt ${ui.escape(t.invoice)}"><div><div class="tx-date">${time.toLocaleDateString('en-US')}</div><div class="tx-time">${time.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}</div><div class="tx-id">#${ui.escape(t.invoice)}</div></div><div class="tx-tender"><span class="brand-chip">${ui.cardBrandAssets[t.cardType]?`<img class="brand-chip-logo ${ui.cardBrandAssets[t.cardType].className}" src="${ui.cardBrandAssets[t.cardType].src}" alt="${ui.escape(t.cardType)}">`:`<span class="brand-fallback">${ui.escape(t.cardType)}</span>`}</span><div><div class="tx-method">${t.kind==='capture'?'Capture':'Sale'}</div><div class="tx-sub">•••• ${ui.escape(t.lastFour)}</div><div class="tx-sub">${t.tipConfirmedAt?'Adjusted':'Unadjusted'}</div></div></div><div><div class="tx-amount">${ui.money(Math.round(t.amount*100))}</div><div class="tx-sub">Tip ${ui.money(t.tipCents)}</div></div></button>`;
        }).join(''):'<p class="attd-tip-empty">'+(query?'No matching transactions.':filter==='pending'?'All eligible tips have been confirmed.':'No eligible transactions in this view.')+'</p>';
        screen.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{queue=rows.map(t=>t.id);position=queue.indexOf(b.dataset.id);edit(b.dataset.id);});
    }
    function edit(id){
        const current=demo.eligible('Tip Adjust').find(t=>t.id===id);
        if(!current){list();ui.toast('This transaction is no longer available.');return;}
        selected={...current};original=current.tipCents;draft=original;replaceOnDigit=true;
        screen.classList.add('attd-tip-editor');
        screen.innerHTML=header('Tip Adjust',`<span class="attd-tip-progress">${position+1}/${queue.length}</span>`)+
            `<div class="attd-tip-reference"><span>#${ui.escape(selected.invoice)} · ${selected.kind==='capture'?'Capture':'Sale'}</span><span>${ui.escape(selected.cardType)} •••• ${ui.escape(selected.lastFour)}</span></div><div class="attd-tip-amount"><div class="amount-context">TIP ADJUST</div><div class="amount-label">FINAL TIP AMOUNT</div><div class="amount-display"><span class="currency">$</span><span class="amount-value" aria-label="Final tip amount"></span></div><div class="attd-tip-saved">Current tip ${ui.money(original)}</div><dl class="attd-details attd-tip-math"><dt>Transaction Amount</dt><dd>${ui.money(selected.transactionAmountCents)}</dd><dt>New Total</dt><dd data-total></dd></dl></div><p class="attd-error" role="alert"></p><div class="attd-tip-keypad"><div class="keypad-panel"><div class="enter-amount-prompt">Enter Final Tip Amount</div></div></div><footer class="attd-tip-footer"><button class="attd-button" data-save-return>Save &amp; Return to List</button></footer>`;
        const keypad=document.querySelector('#keypad-overlay .key-grid').cloneNode(true);
        keypad.querySelectorAll('button').forEach(b=>{
            const old=b.getAttribute('onclick')||'';
            const value=b.classList.contains('key-ok')?'OK':b.classList.contains('key-clear')?'C':old.match(/press\('([^']+)'\)/)?.[1];
            b.removeAttribute('onclick');b.disabled=false;b.onclick=()=>value==='OK'?save(true):press(value);
        });
        screen.querySelector('.keypad-panel').append(keypad);
        screen.querySelector('.back-btn').onclick=()=>leave(list);
        screen.querySelector('[data-save-return]').onclick=()=>save(false);
        updateAmount();screen.querySelector('.back-btn').focus();
    }
    function updateAmount(){
        screen.querySelector('.amount-value').textContent=(draft/100).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
        screen.querySelector('[data-total]').textContent=ui.money(selected.transactionAmountCents+draft);
        screen.querySelector('.key-ok').innerHTML=`OK<small>${position<queue.length-1?'Save & Next':'Save & Finish'}</small>`;
    }
    function press(key){
        if(key==='C')draft=0;
        else if(key==='BS')draft=Math.floor(draft/10);
        else if(/^\d+$/.test(key||'')){const next=Number((replaceOnDigit?'':String(draft))+key);if(next>99999999)return;draft=next;}
        else return;
        replaceOnDigit=false;screen.querySelector('.attd-error').textContent='';updateAmount();
    }
    function save(next){
        try{demo.adjustTip({id:selected.id,tipCents:draft,batchId:selected.batchId,revision:selected.tipRevision||0});}
        catch(error){screen.querySelector('.attd-error').textContent=error.message;return;}
        original=draft;
        if(next){while(++position<queue.length){if(demo.eligible('Tip Adjust').some(t=>t.id===queue[position])){edit(queue[position]);ui.toast('Tip saved');return;}}}
        list();ui.toast('Tip saved');
    }
    function keys(e){
        if(!screen||screen.inert)return;
        if(e.key==='Escape'){e.preventDefault();selected?leave(list):exit();return;}
        if(selected&&(/^\d$/.test(e.key)||['Backspace','Delete'].includes(e.key))){e.preventDefault();press(e.key==='Backspace'?'BS':e.key==='Delete'?'C':e.key);}
        // Enter on focused buttons keeps its native behavior; all buttons are accessible by Tab.
        if(e.key==='Tab'){const items=[...screen.querySelectorAll('button,input')].filter(n=>!n.disabled&&n.getClientRects().length);const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}
    }
    function begin({fromBatch=false}={}){
        if(screen)return;
        ui.pin('Tip Adjust',()=>{
            returnToBatch=fromBatch;filter=fromBatch?'pending':'all';query='';searchOpen=false;
            resetTransactionAmount(null);showAppView('transactions');
            screen=document.createElement('section');screen.className='attd-tip attd-transaction-list';screen.setAttribute('aria-label','Tip Adjust');
            const frame=document.querySelector('.phone-frame');siblings=[...frame.children].filter(n=>!n.inert);siblings.forEach(n=>n.inert=true);frame.append(screen);
            document.addEventListener('keydown',keys);window.addEventListener('beforeunload',beforeUnload);list();
        });
    }
    window.AttendedTip={begin};
    document.addEventListener('DOMContentLoaded',()=>{
        const p=new URLSearchParams(location.search);
        if(p.get('action')==='Tip Adjust')begin({fromBatch:p.get('from')==='close-batch'});
    });
})();
