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
    function persist() { sessionStorage.setItem(KEY, JSON.stringify(state)); }
    const rows = () => state.rows;
    const find = id => [...state.rows,...state.last].find(t=>t.id===id);
    const eligible = action => rows().filter(t => {
        if (action === 'Auth-Incremental' || action === 'Capture' || action === 'review') return t.kind==='preauth' && t.status==='OPEN AUTH';
        if (action === 'Void') return t.status!=='VOIDED' && t.status!=='CAPTURED' && t.batchId===state.batchId;
        return true;
    });
    function record({operationId,action,amountCents,sourceId,invoice,cardType='VISA',lastFour='0100',paymentMethod='card'}) {
        if (state.operations.includes(operationId)) return;
        const source=find(sourceId);
        if (action==='Void' && source) source.status='VOIDED';
        else if (action==='Auth-Incremental' && source) source.amount=Math.round(source.amount*100+amountCents)/100;
        else {
            if (action==='Capture' && source) source.status='CAPTURED';
            const kind=action==='PreAuth'?'preauth':action==='Capture'?'capture':action==='Refund'?'refund':'payment';
            state.rows.unshift(make(invoice, (kind==='refund'?-1:1)*amountCents/100,kind,'00:00:00',{
                tranTime:new Date().toLocaleString('sv-SE'), batchId:state.batchId, cardType, lastFour,
                tenderType:paymentMethod, ...(paymentMethod==='cash'?{cardType:'CASH',lastFour:''}:{}), id:`attd_${operationId}`}));
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
        state.last=state.rows.filter(t=>t.batchId===state.batchId).map(t=>({...t}));
        state.lastBatchId=state.batchId;
        state.batchId=String(Number(state.batchId)+1);
        // Open authorizations remain discoverable after the settlement warning.
        persist(); return state.lastBatchId;
    }
    window.AttendedDemo={rows,find,eligible,record,toBatch,closeBatch};
})();
