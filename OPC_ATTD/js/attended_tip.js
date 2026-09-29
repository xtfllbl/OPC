// Current-batch Tip Adjust: save entry values, review all tipped transactions, then process.
(() => {
    const ui=AttendedUI,demo=AttendedDemo;
    let screen,siblings=[],returnToBatch=false,filter='pending',query='',searchOpen=false,view='list';
    let selected=null,queue=[],position=0,draft=0,original=0,replaceOnDigit=true;
    let feedbackTimer;
    const labels={all:'ALL',pending:'UN-TIPPED',adjusted:'TIPPED'};
    const tip=t=>t.tipSavedAt?t.tipDraftCents:t.tipCents;
    const sorted=rows=>rows.sort((a,b)=>b.tranTime.localeCompare(a.tranTime)||b.invoice.localeCompare(a.invoice));
    const eligible=()=>sorted(demo.eligible('Tip Adjust'));
    function matches(){return eligible().filter(t=>(filter==='all'||(filter==='pending'?!t.tipSavedAt:!!t.tipSavedAt))&&`${t.invoice} ${t.lastFour}`.includes(query.trim()));}
    function editorStatus(t){return `<span class="attd-tip-reference-status ${t.tipSavedAt?'is-adjusted':''}" role="status"><span class="attd-tip-status-label">${t.tipSavedAt?'TIPPED':'UN-TIPPED'}</span><span class="attd-tip-status-card" aria-hidden="true"><span class="attd-status unadjusted">UN-TIPPED</span><span class="attd-status attd-tip-status-back">TIPPED</span></span></span>`;}
    function clearSaveFeedback(){
        clearTimeout(feedbackTimer);
        screen?.querySelector('.key-ok')?.classList.remove('is-saved');
        const announcement=screen?.querySelector('.attd-tip-save-label');
        if(announcement)announcement.textContent='';
    }
    function showSaveFeedback(){
        screen.querySelector('.key-ok').classList.add('is-saved');
        screen.querySelector('.attd-tip-save-label').textContent='Tip saved';
        feedbackTimer=setTimeout(clearSaveFeedback,1600);
    }
    function dateTime(t){const time=new Date(t.tranTime.replace(' ','T'));return {date:time.toLocaleDateString('en-US'),time:time.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})};}
    function header(title,extra=''){return `<header class="app-header"><div class="left"><button class="back-btn" aria-label="Back">${ui.icon('chevron_left')}</button></div><h2 class="title">${title}</h2><div class="right">${extra}</div></header>`;}
    function exit(){
        clearSaveFeedback();
        screen?.remove();screen=null;siblings.forEach(n=>n.inert=false);siblings=[];
        document.removeEventListener('keydown',keys);window.removeEventListener('beforeunload',beforeUnload);
        if(returnToBatch){location.href='batch_reports.html?mode=close';return;}
        showAppView('transactions');document.querySelector('[onclick="doAction(\'Tip Adjust\')"]')?.focus();
    }
    function dirty(){return selected&&draft!==original;}
    function leave(run){if(!dirty()){run();return;}ui.modal({title:'Discard Tip Changes?',body:'<p>This tip has not been saved.</p>',actions:[{label:'Keep Editing',primary:true},{label:'Discard Changes',run}]});}
    function beforeUnload(e){if(dirty()){e.preventDefault();e.returnValue='';}}
    function resetView(name){clearSaveFeedback();view=name;selected=null;screen.classList.remove('attd-tip-editor');}
    function list(){
        resetView('list');
        const adjusted=demo.adjustedTips().length;
        screen.innerHTML=header('Tip Adjust',`<button class="icon-btn" aria-label="Search transactions" aria-expanded="${searchOpen}">${ui.icon('search')}</button><button class="attd-button primary attd-tip-review" ${adjusted?'':'disabled'}>Review (${adjusted})</button>`)+
            `<div class="toolbar attd-tip-filters" role="group" aria-label="Transaction status">${Object.entries(labels).map(([key,label])=>`<button class="filter-item ${key===filter?'active':''}" data-filter="${key}" aria-pressed="${key===filter}">${label}</button>`).join('')}</div><div class="search-wrap ${searchOpen?'open':''}"><input class="search-input" aria-label="Receipt number or card last 4" placeholder="Receipt # or card last 4" value="${ui.escape(query)}"></div><div class="attd-tip-summary"><span>Batch #${ui.escape(demo.toBatch('current').summary.batchId)}</span><span class="count-text"></span></div><div class="table-head"><span>Time / Receipt</span><span>Card / Type</span><span>Amounts</span></div><div class="tx-list"></div>`;
        screen.querySelector('.back-btn').onclick=exit;
        screen.querySelector('.attd-tip-review').onclick=summary;
        screen.querySelector('[aria-label="Search transactions"]').onclick=e=>{searchOpen=!searchOpen;screen.querySelector('.search-wrap').classList.toggle('open',searchOpen);e.currentTarget.setAttribute('aria-expanded',searchOpen);if(searchOpen)screen.querySelector('input').focus();else{query='';screen.querySelector('input').value='';renderRows();}};
        screen.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;list();});
        screen.querySelector('input').oninput=e=>{query=e.target.value;renderRows();};
        renderRows();screen.querySelector('.back-btn').focus();
    }
    function renderRows(){
        const rows=matches();
        screen.querySelector('.count-text').textContent=`${rows.length} transaction${rows.length===1?'':'s'}`;
        screen.querySelector('.tx-list').innerHTML=rows.length?rows.map(t=>{
            const time=dateTime(t);
            return `<button class="tx-row" data-id="${ui.escape(t.id)}" aria-label="Adjust tip for receipt ${ui.escape(t.invoice)}, ${t.tipSavedAt?'Tipped':'Un-tipped'}"><div><div class="tx-date">${time.date}</div><div class="tx-time">${time.time}</div><div class="tx-id">#${ui.escape(t.invoice)}</div></div><div class="tx-tender"><span class="brand-chip">${ui.cardBrandAssets[t.cardType]?`<img class="brand-chip-logo ${ui.cardBrandAssets[t.cardType].className}" src="${ui.cardBrandAssets[t.cardType].src}" alt="${ui.escape(t.cardType)}">`:`<span class="brand-fallback">${ui.escape(t.cardType)}</span>`}</span><div><div class="tx-method">Sale</div><div class="tx-sub">•••• ${ui.escape(t.lastFour)}</div></div></div><div class="attd-tip-list-amounts"><span>Amount</span><strong>${ui.money(t.transactionAmountCents)}</strong><span>Tip</span><strong class="attd-tip-list-value ${t.tipSavedAt?'is-tipped':'is-untipped'}">${ui.money(tip(t))}</strong><span>Total</span><strong>${ui.money(t.transactionAmountCents+tip(t))}</strong></div></button>`;
        }).join(''):`<p class="attd-tip-empty">${query?'No matching transactions.':filter==='adjusted'?'No tipped transactions to process.':filter==='pending'?'No un-tipped transactions.':'No transactions awaiting tip adjustment.'}</p>`;
        bindRows(rows);
    }
    function bindRows(rows){screen.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{queue=rows.map(t=>t.id);position=queue.indexOf(b.dataset.id);edit(b.dataset.id);});}
    function summary(){
        resetView('summary');
        const rows=sorted(demo.adjustedTips());
        const total=rows.reduce((sum,t)=>sum+t.tipDraftCents,0);
        screen.innerHTML=header('Tip Summary')+
            `<div class="attd-tip-review-totals"><div><span>Tip Adjust Count</span><strong>${rows.length}</strong></div><div><span>Tip Adjust Total</span><strong>${ui.money(total)}</strong></div><p>All tipped transactions in Batch #${ui.escape(demo.toBatch('current').summary.batchId)}</p></div><div class="attd-tip-review-head"><span>Transaction</span><span>Amounts</span></div><div class="tx-list">${rows.map(t=>{const time=dateTime(t);return `<button class="attd-tip-review-row" data-id="${ui.escape(t.id)}" aria-label="Review receipt ${ui.escape(t.invoice)}"><div><strong>#${ui.escape(t.invoice)}</strong><span>${time.date} · ${time.time}</span><span>${ui.escape(t.cardType)} •••• ${ui.escape(t.lastFour)}</span></div><div class="attd-tip-review-amounts"><span>Amount</span><strong>${ui.money(t.transactionAmountCents)}</strong><span>Tip</span><strong class="attd-tip-review-value">${ui.money(t.tipDraftCents)}</strong><span>Total</span><strong>${ui.money(t.transactionAmountCents+t.tipDraftCents)}</strong></div></button>`;}).join('')||'<p class="attd-tip-empty">No tipped transactions to process.</p>'}</div><footer class="attd-tip-review-footer"><button class="attd-button primary" ${rows.length?'':'disabled'}>Process ${rows.length} adjustment${rows.length===1?'':'s'}</button></footer>`;
        screen.querySelector('.back-btn').onclick=list;bindRows(rows);
        screen.querySelector('footer button').onclick=process;
        screen.querySelector('.back-btn').focus();
    }
    function process(){
        const processed=demo.processTips();
        resetView('result');queue=[];position=0;
        screen.innerHTML=header('Tip Adjust')+`<div class="attd-tip-result" role="status">${ui.icon('check_circle')}<h3>Adjustments completed</h3><p>${processed.length} transaction${processed.length===1?'':'s'} processed successfully.</p><button class="attd-button primary">Done</button></div>`;
        screen.querySelector('.back-btn').onclick=list;
        screen.querySelector('.attd-tip-result button').onclick=list;
        screen.querySelector('.attd-tip-result button').focus();
    }
    function edit(id){
        clearSaveFeedback();
        const current=demo.eligible('Tip Adjust').find(t=>t.id===id);
        if(!current){list();ui.toast('This transaction is no longer available.');return;}
        view='editor';selected={...current};original=tip(current);draft=original;replaceOnDigit=true;
        const time=dateTime(selected);
        screen.classList.add('attd-tip-editor');
        screen.innerHTML=`<header class="app-header attd-tip-editor-header"><button class="back-btn attd-tip-list-back" aria-label="Back to list">${ui.icon('chevron_left')}</button><nav class="attd-tip-switcher" aria-label="Transaction navigation"><button class="back-btn" aria-label="Previous transaction" ${position===0?'disabled':''}>${ui.icon('chevron_left')}</button><span class="attd-tip-progress" aria-live="polite">${position+1} / ${queue.length}</span><button class="back-btn" aria-label="Next transaction" ${position===queue.length-1?'disabled':''}>${ui.icon('chevron_right')}</button></nav></header><div class="attd-tip-reference"><div class="attd-tip-reference-top"><strong>#${ui.escape(selected.invoice)} · Sale</strong>${editorStatus(selected)}</div><span>${time.date} · ${time.time}</span><span>${ui.escape(selected.cardType)} •••• ${ui.escape(selected.lastFour)}</span></div><div class="attd-tip-amount"><div class="amount-context">Tip Adjust</div><div class="amount-label">TIP AMOUNT</div><div class="amount-display"><span class="currency">$</span><span class="amount-value" aria-label="Tip amount"></span></div><p class="amount-error show attd-tip-error" role="alert"></p><div class="attd-hold"><div>Transaction Amount: ${ui.money(selected.transactionAmountCents)}</div><div>New Total: <span data-total></span></div></div></div><div class="attd-tip-keypad"><div class="keypad-panel"><div class="enter-amount-prompt">Enter Tip Amount</div></div></div>`;
        setTransactionTypeLabel(screen.querySelector('.amount-context'),'TIP ADJUST');
        const keypad=document.querySelector('#keypad-overlay .key-grid').cloneNode(true);
        keypad.querySelectorAll('button').forEach(b=>{
            const old=b.getAttribute('onclick')||'';
            const value=b.classList.contains('key-ok')?'OK':b.classList.contains('key-clear')?'C':old.match(/press\('([^']+)'\)/)?.[1];
            b.removeAttribute('onclick');b.disabled=false;b.onclick=()=>value==='OK'?save():press(value);
        });
        screen.querySelector('.keypad-panel').append(keypad);
        const saveButton=keypad.querySelector('.key-ok');
        saveButton.setAttribute('aria-label','SAVE');
        saveButton.innerHTML='<span class="attd-tip-save-card" aria-hidden="true"><span class="attd-tip-save-face">SAVE</span><span class="attd-tip-save-face attd-tip-save-back"><svg viewBox="0 0 24 24"><path d="m5 12 4 4 10-10"/></svg><span>SAVED</span></span></span><span class="attd-tip-save-label" role="status"></span>';
        screen.querySelector('.attd-tip-list-back').onclick=()=>leave(list);
        screen.querySelector('[aria-label="Previous transaction"]').onclick=()=>switchTransaction(-1);
        screen.querySelector('[aria-label="Next transaction"]').onclick=()=>switchTransaction(1);
        updateAmount();screen.querySelector('.attd-tip-list-back').focus();
    }
    function updateAmount(){
        screen.querySelector('.amount-value').textContent=(draft/100).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
        screen.querySelector('[data-total]').textContent=ui.money(selected.transactionAmountCents+draft);
    }
    function press(key){
        if(key==='C')draft=0;
        else if(key==='BS')draft=Math.floor(draft/10);
        else if(/^\d+$/.test(key||'')){const next=Number((replaceOnDigit?'':String(draft))+key);if(next>99999999)return;draft=next;}
        else return;
        clearSaveFeedback();replaceOnDigit=false;screen.querySelector('.attd-tip-error').textContent='';updateAmount();
    }
    function switchTransaction(direction){
        const next=position+direction;
        if(next<0||next>=queue.length)return;
        leave(()=>{position=next;edit(queue[position]);});
    }
    function save(){
        clearSaveFeedback();
        try{selected={...demo.adjustTip({id:selected.id,tipCents:draft,batchId:selected.batchId,revision:selected.tipRevision||0})};}
        catch(error){screen.querySelector('.attd-tip-error').textContent=error.message;return;}
        original=draft;replaceOnDigit=true;
        screen.querySelector('.attd-tip-error').textContent='';
        const badge=screen.querySelector('.attd-tip-reference-status');
        badge.classList.add('is-adjusted');
        badge.querySelector('.attd-tip-status-label').textContent='TIPPED';
        showSaveFeedback();
    }
    function keys(e){
        if(!screen||screen.inert)return;
        if(e.key==='Escape'){e.preventDefault();selected?leave(list):view==='list'?exit():list();return;}
        if(selected&&(/^\d$/.test(e.key)||['Backspace','Delete'].includes(e.key))){e.preventDefault();press(e.key==='Backspace'?'BS':e.key==='Delete'?'C':e.key);}
        // Enter on focused buttons keeps its native behavior; all buttons are accessible by Tab.
        if(e.key==='Tab'){const items=[...screen.querySelectorAll('button,input')].filter(n=>!n.disabled&&n.getClientRects().length);const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}
    }
    function begin({fromBatch=false}={}){
        if(screen)return;
        ui.pin('Tip Adjust',()=>{
            returnToBatch=fromBatch;filter='pending';query='';searchOpen=false;
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
