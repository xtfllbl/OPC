// Browser-local fixtures for the attended design prototype; no payment or hardware execution.
(() => {
    const KEY = 'opc-attended-demo-v1';
    const make = (invoice, amount, kind, time, extra = {}) => ({id: `attd_${invoice}`, invoice,
        amount, kind, tranTime: `2026-09-16 ${time}`, cardType: 'VISA', lastFour: '0100',
        tenderType: 'card', status: kind === 'preauth' ? 'OPEN AUTH' : 'APPROVED', batchId: '2071', ...extra});
    const seed = [
        make('001053',30,'preauth','17:34:00'), make('001052',20,'preauth','16:18:00'),
        make('001051',104.65,'payment','16:03:00',{cashEquivalentCents:10000, feeCents:400, tipCents:65}),
        make('001048',140,'payment','15:51:00',{cashEquivalentCents:12500, feeCents:500, tipCents:1000}),
        make('C000007',0.15,'payment','14:33:00',{tenderType:'cash',cardType:'CASH',lastFour:''}),
        make('001039',36,'preauth','10:53:00'), make('001038',35,'preauth','10:50:00'),
        make('001037',30,'preauth','10:32:00'),
        ...[90,30,50,40,60,70,50.23].map((n,i)=>make(String(1033-i).padStart(6,'0'),n,'preauth',`09:${String(50-i).padStart(2,'0')}:00`)),
        make('001020',-12,'refund','08:45:00'), make('001019',25,'capture','08:30:00'),
        make('001018',90,'payment','08:20:00',{status:'VOIDED'}),
        make('001017',-10,'refund','08:10:00',{status:'VOIDED'}),
        make('001016',40,'capture','08:00:00',{status:'VOIDED'})
    ];
    const last = [make('001010',105.54,'payment','17:40:00',{batchId:'2041',cashEquivalentCents:10000,feeCents:400,tipCents:154}),
        make('001009',-14.41,'refund','17:30:00',{batchId:'2041'}),
        make('001008',35,'preauth','17:20:00',{batchId:'2041'})];
    let state;
    try { state = JSON.parse(sessionStorage.getItem(KEY)); } catch (_) {}
    if (!state || !Array.isArray(state.rows)) state = {rows:seed, last, batchId:'2071', lastBatchId:'2041', operations:[]};
    // Known fixtures model credit cards; unknown imported tenders do not acquire capability.
    const fixtureIds=new Set([...seed,...last].filter(t=>t.tenderType==='card').map(t=>t.id));
    [...state.rows,...state.last].forEach(t=>{
        if(t.tipAdjustSupported===undefined)t.tipAdjustSupported=fixtureIds.has(t.id);
        if(['payment','capture'].includes(t.kind)){
            t.tipCents=Number.isSafeInteger(t.tipCents)?t.tipCents:0;
            t.transactionAmountCents??=Math.round(t.amount*100)-t.tipCents;
        }
    });
    function persist(next=state) { sessionStorage.setItem(KEY, JSON.stringify(next)); }
    function canAdjust(t){return t.batchId===state.batchId && t.status==='APPROVED' &&
        t.kind==='payment' && t.tenderType==='card' && t.tipAdjustSupported===true && !t.tipProcessedAt;}
    function adjustTip({id,tipCents,batchId,revision}){
        const current=state.rows.find(t=>t.id===id);
        if(!current||!canAdjust(current)||current.batchId!==batchId)throw new Error('This transaction is no longer available for tip adjustment. Return to the list.');
        if((current.tipRevision||0)!==revision)throw new Error('This transaction changed. Return to the list and reopen it.');
        if(!Number.isSafeInteger(tipCents)||tipCents<0||tipCents>99999999)throw new Error('Enter a tip between $0.00 and $999,999.99.');
        if(current.tipSavedAt && current.tipDraftCents===tipCents)return current;
        const now=new Date().toISOString();
        const updated={...current,tipDraftCents:tipCents,tipSavedAt:now,tipRevision:(current.tipRevision||0)+1};
        const next={...state,rows:state.rows.map(t=>t===current?updated:t)};
        // Commit only after storage succeeds, retaining both the old amounts and the UI draft on failure.
        try{persist(next);}catch(_){throw new Error('Unable to save the tip. Please try again.');}
        state=next;return updated;
    }
    const pendingTips=()=>eligible('Tip Adjust').filter(t=>!t.tipSavedAt);
    const adjustedTips=()=>eligible('Tip Adjust').filter(t=>t.tipSavedAt);
    function processTips(){
        // Prototype execution always succeeds. Only processing changes effective financial amounts.
        const ready=adjustedTips();
        if(!ready.length)return [];
        const now=new Date().toISOString(),updates=new Map(),entries=[];
        ready.forEach(t=>{
            const tipCents=t.tipDraftCents;
            const updated={...t,tipCents,amount:(t.transactionAmountCents+tipCents)/100,
                tipConfirmedAt:now,tipProcessedAt:now,tipRevision:(t.tipRevision||0)+1};
            delete updated.tipDraftCents;delete updated.tipSavedAt;
            updates.set(t.id,updated);
            entries.push({id:t.id,batchId:t.batchId,at:now,previousTipCents:t.tipCents,tipCents,financialChange:tipCents!==t.tipCents});
        });
        const next={...state,rows:state.rows.map(t=>updates.get(t.id)||t),tipAdjustments:[...(state.tipAdjustments||[]),...entries]};
        persist(next);state=next;return [...updates.values()];
    }
    function receipt(id){const t=find(id);return t?{...t,amountCents:Math.round(Math.abs(t.amount)*100)}:null;}

    const rows = () => state.rows;
    const find = id => [...state.rows,...state.last].find(t=>t.id===id);
    const eligible = action => rows().filter(t => {
        if (action === 'Auth-Incremental' || action === 'Capture' || action === 'review') return t.kind==='preauth' && t.status==='OPEN AUTH';
        if (action === 'Tip Adjust') return canAdjust(t);
        if (action === 'Void') return t.status!=='VOIDED' && t.status!=='CAPTURED' && t.batchId===state.batchId;
        return true;
    });
    function record({operationId,action,amountCents,sourceId,invoice,cardType='VISA',lastFour='0100',paymentMethod='card',tipCents=0,feeCents=0,cashEquivalentCents=0,tipAdjustSupported=false}) {
        if (state.operations.includes(operationId)) return;
        const source=find(sourceId);
        if (action==='Void' && source) source.status='VOIDED';
        else if (action==='Auth-Incremental' && source) source.amount=Math.round(source.amount*100+amountCents)/100;
        else {
            if (action==='Capture' && source) source.status='CAPTURED';
            const kind=action==='PreAuth'?'preauth':action==='Capture'?'capture':action==='Refund'?'refund':'payment';
            state.rows.unshift(make(invoice, (kind==='refund'?-1:1)*amountCents/100,kind,'00:00:00',{
                tranTime:new Date().toLocaleString('sv-SE'), batchId:state.batchId, cardType, lastFour,
                tenderType:paymentMethod, tipCents,feeCents,cashEquivalentCents,transactionAmountCents:amountCents-tipCents,
                tipAdjustSupported:paymentMethod==='card'&&kind==='payment'&&tipAdjustSupported, ...(paymentMethod==='cash'?{cardType:'CASH',lastFour:''}:{}), id:`attd_${operationId}`}));
        }
        state.operations.push(operationId); persist();
    }
    function toBatch(kind) {
        const selected=kind==='last'?state.last:state.rows.filter(t=>t.batchId===state.batchId);
        return {summary:{batchId:kind==='last'?state.lastBatchId:state.batchId, mid:'7890187619',tid:'11000936',currencyCode:'840',settleStatus:kind==='last'?'CLOSED':'OPEN'},
            settlementList:selected.map(t=>({...t, amount:Math.round(Math.abs(t.amount)*100), transId:t.invoice,receiptNo:t.invoice,cardLastFour:t.lastFour,
                transType:t.status==='VOIDED'?'VOID '+t.kind.toUpperCase():t.status==='CAPTURED'?'AUTH COMPLETED':t.kind==='preauth'?'AUTH':t.kind==='payment'?(t.tenderType==='cash'?'CASH SALE':'SALE'):t.kind.toUpperCase()}))};
    }
    function closeBatch() {
        processTips();
        state.last=state.rows.filter(t=>t.batchId===state.batchId).map(t=>({...t}));
        state.lastBatchId=state.batchId;
        state.batchId=String(Number(state.batchId)+1);
        // Open authorizations remain discoverable after the settlement warning.
        persist(); return state.lastBatchId;
    }
    function expandTipSamples(){
        // One-time expansion of the original demo batch. Never repopulate a closed batch
        // or reset a cashier's saved amounts, confirmation states, or later transactions.
        if(state.tipSamplesVersion===1 || state.batchId!=='2071')return;
        const current=state.rows.filter(canAdjust);
        const confirmed=current.filter(t=>t.tipConfirmedAt).length;
        const counts=[Math.max(0,10-confirmed),Math.max(0,10-(current.length-confirmed))];
        const additions=[];
        const cashPrices=[1850,2475,3290,4560,5800,6725,7990,8850,9625,11250];
        const confirmedTips=[0,150,275,350,420,500,650,800,950,1200];
        const originalTips=[0,0,125,0,240,0,375,0,600,0];
        const cards=['VISA','MASTERCARD','AMEX','DISCOVER'];
        const lastDigits=['4242','0198','2004','4407'];
        for(let group=0;group<2;group++)for(let i=0;i<counts[group];i++){
            const slot=i*2+group,invoice=String(1100+slot).padStart(6,'0');
            if(state.rows.some(t=>t.id===`attd_${invoice}`))continue;
            const cashEquivalentCents=cashPrices[i],feeCents=Math.round(cashEquivalentCents*.04);
            const transactionAmountCents=cashEquivalentCents+feeCents;
            const tipCents=group===0?confirmedTips[i]:originalTips[i];
            const time=`17:${String(30-slot).padStart(2,'0')}:00`;
            additions.push(make(invoice,(transactionAmountCents+tipCents)/100,'payment',time,{
                cardType:cards[slot%cards.length],lastFour:lastDigits[slot%lastDigits.length],
                cashEquivalentCents,feeCents,transactionAmountCents,tipCents,tipAdjustSupported:true,
                ...(group===0?{tipConfirmedAt:`2026-09-16T${time}+08:00`,tipRevision:1}:{})
            }));
        }
        const next={...state,tipSamplesVersion:1,rows:[...state.rows,...additions].sort((a,b)=>b.tranTime.localeCompare(a.tranTime)||b.invoice.localeCompare(a.invoice))};
        try{persist(next);state=next;}catch(_){/* Retain the existing demo if storage is unavailable. */}
    }
    expandTipSamples();
    function upgradeTipWorkflow(){
        if(state.tipWorkflowVersion===1)return;
        // Preserve previously effective amounts and history. Existing ADJUSTED entries
        // become saved work, without undoing what an older version already recorded.
        const next={...state,tipWorkflowVersion:1,rows:state.rows.map(t=>canAdjust(t)&&t.tipConfirmedAt&&!t.tipSavedAt?
            {...t,tipDraftCents:t.tipCents,tipSavedAt:t.tipConfirmedAt}:t)};
        persist(next);state=next;
    }
    upgradeTipWorkflow();
    window.AttendedDemo={rows,find,eligible,record,toBatch,closeBatch,adjustTip,pendingTips,adjustedTips,processTips,receipt};
})();
