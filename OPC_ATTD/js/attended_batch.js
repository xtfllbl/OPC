(() => {
    const ui=AttendedUI;
    let currentData=null;
    const closeMode=new URLSearchParams(location.search).get('mode')==='close';
    function row(label,amount,count=''){return `<div class="attd-report-row"><span>${label}</span><span>${count}</span><strong>${ui.money(amount)}</strong></div>`;}
    function render(data,kind){
        currentData=data;
        const list=data.settlementList;
        const button=document.getElementById('attd-close-batch');button.hidden=!(closeMode&&kind==='current'&&data.summary.settleStatus!=='CLOSED');
        document.querySelector('.batch-cash-section').hidden=!list.some(t=>t.cardType==='CASH');
        document.querySelector('.batch-reconciliation-item.total').hidden=true;
        const cashHeader=document.getElementById('batch-cash-net').parentElement;cashHeader.hidden=!list.some(t=>t.cardType==='CASH');
        const fees=list.filter(t=>getBatchTransactionKind(t).settlement!=='excluded').reduce((a,t)=>({cash:a.cash+(t.cashEquivalentCents||0),fee:a.fee+(t.feeCents||0),tip:a.tip+(t.tipCents||0)}),{cash:0,fee:0,tip:0});
        document.getElementById('attd-fees').innerHTML='<div class="batch-report-heading">Dual Pricing &amp; Fee Savings</div>'+row('TOTAL CASH PRICE EQUIV',fees.cash)+row('CARD SERVICE FEE COLLECTED',fees.fee)+row('TOTAL TIPS COLLECTED',fees.tip)+row('TOTAL MERCHANT FEE SAVINGS',fees.fee);
        const groups=[['VOIDED SALES',t=>/^VOID (PAYMENT|SALE)/.test(t.transType)],['VOIDED REFUNDS',t=>t.transType==='VOID REFUND'],['VOIDED CAPTURES',t=>t.transType==='VOID CAPTURE'],['OPEN PRE-AUTHS',t=>t.transType==='AUTH'&&(!t.status||t.status==='OPEN AUTH')]];
        document.getElementById('attd-audit').innerHTML='<div class="batch-report-heading">Audit &amp; Risk Summary</div>'+groups.map(([label,test])=>{const rows=list.filter(test);return row(label,rows.reduce((n,t)=>n+Math.abs(t.amount),0),rows.length);}).join('');
    }
    function closeConfirmation(){
        const pending=AttendedDemo.pendingTips().length,adjusted=AttendedDemo.adjustedTips().length;
        const body=`<p><strong>${adjusted}</strong> adjusted transaction${adjusted===1?'':'s'} will be processed automatically before closing.</p><p><strong>${pending}</strong> transaction${pending===1?' has':'s have'} no tip adjustment amount set.</p><p>Transactions without a saved adjustment will keep their existing amounts.</p>`;
        ui.modal({title:'Close Current Batch?',body,actions:[{label:'Cancel'},{label:adjusted?'Adjust & Close Batch':'Close Now',primary:true,run:checkOpen}]});
    }
    function checkOpen(){
        const open=AttendedDemo.eligible('review').filter(t=>t.batchId===currentData.summary.batchId);
        if(!open.length){complete();return;}
        ui.modal({title:`⚠ ${open.length} Uncaptured Pre-Auths Found`,body:`<p><strong>You have ${open.length} open pre-auths (${ui.money(open.reduce((n,t)=>n+Math.round(t.amount*100),0))}) not yet completed.</strong></p><p>Closing the batch now will require manual capture later.</p>`,actions:[{label:'Review Pre-Auths',run:()=>location.href='transactions.html?'+new URLSearchParams({action:'review',batch:currentData.summary.batchId})},{label:'Proceed Anyway',danger:true,run:complete}]});
    }
    function complete(){
        const batchId=AttendedDemo.closeBatch();
        // Read the settled snapshot after automatic tip processing, not the stale report display.
        const settled=AttendedDemo.toBatch('last');
        const amount=formatBatchAmount(summarizeBatchCardTransactions(settled.settlementList).cardNet,settled.summary.currencyCode);
        const screen=document.createElement('section');screen.className='attd-settlement';screen.innerHTML=`<div class="merchant-name" data-merchant-name>Merchant</div><span class="material-symbols-rounded success">check_circle</span><h2>CLOSE BATCH</h2><div class="total">${ui.escape(amount)}</div><div class="attd-settlement-meta"><p>Batch #${ui.escape(batchId)} Closed Successfully</p><span class="attd-settlement-batch"><small>BATCH</small>${ui.escape(batchId)}</span></div><div class="attd-divider">SETTLEMENT COPY</div><div class="attd-choice-grid"><button class="attd-choice" data-print="summary">${ui.icon('print')}Print Summary</button><button class="attd-choice" data-print="details">${ui.icon('print')}Print Details</button></div><button class="attd-button" id="settlement-skip">${ui.icon('block')}<span data-skip-label>No Receipt (10s)</span></button>`;
        document.querySelector('.phone-frame').append(screen);
        window.MerchantContext?.apply(screen);
        let remaining=10;const timer=setInterval(()=>{remaining--;screen.querySelector('[data-skip-label]').textContent=`No Receipt (${remaining}s)`;if(remaining<=0){clearInterval(timer);location.href='index.html';}},1000);
        screen.querySelector('#settlement-skip').onclick=()=>{clearInterval(timer);location.href='index.html';};
        screen.querySelectorAll('[data-print]').forEach(b=>b.onclick=async()=>{clearInterval(timer);activeBatchKind='last';activeHistoricalBatchId=batchId;await handleBatchReportPrint(b.dataset.print);ui.toast(batchPrintToast.textContent);screen.querySelector('[data-skip-label]').textContent='Done';});
    }
    window.AttendedBatch={render};
    document.addEventListener('DOMContentLoaded',()=>{
        document.getElementById('attd-close-batch').onclick=closeConfirmation;
        if(closeMode)openBatchDetail('current');
    });
})();
