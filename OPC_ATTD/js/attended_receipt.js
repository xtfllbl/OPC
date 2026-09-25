(() => {
    let timer=null,printingTimer=null,remaining=10;
    const skipLabel=document.querySelector('.no-receipt-option span:last-child');
    function stop(){clearInterval(timer);timer=null;}
    function start(){stop();remaining=10;skipLabel.textContent=`No Receipt (${remaining}s)`;timer=setInterval(()=>{if(document.hidden||completionPending)return;remaining--;skipLabel.textContent=`No Receipt (${remaining}s)`;if(remaining<=0){stop();skipCustomerCopy();}},1000);}
    function merchant(){
        stop();phoneFrame.classList.add('attd-printing');document.querySelector('.receipt-options').inert=true;
        const status=document.createElement('div');status.className='attd-merchant-print';status.setAttribute('role','status');status.textContent='Merchant Copy Printing…';phoneFrame.append(status);
        printingTimer=setTimeout(()=>{status.remove();phoneFrame.classList.remove('attd-printing');document.querySelector('.receipt-options').inert=false;start();},1600);
    }
    window.AttendedReceipt={stop,start,merchant};
    if(failureEvaluationCents!==null&&amountEndsInFour(failureEvaluationCents))return;
    const p=new URLSearchParams(location.search);
    let operationId=p.get('operationId');
    if(!operationId){operationId=crypto.randomUUID();p.set('operationId',operationId);history.replaceState(null,'',location.pathname+'?'+p);}
    const action=({'PREAUTH':'PreAuth','AUTH':'PreAuth','AUTH-INCREMENTAL':'Auth-Incremental','CAPTURE':'Capture','VOID':'Void','REFUND':'Refund'})[transactionType]||'Sale';
    AttendedDemo.record({operationId,action,amountCents,sourceId:p.get('sourceId'),invoice:transactionSequence,cardType:cardBrand.toUpperCase(),lastFour:maskedCard.replace(/\D/g,'').slice(-4),paymentMethod});
    if(!signatureRequired)merchant();
    window.addEventListener('pagehide',()=>{stop();clearTimeout(printingTimer);});
})();
