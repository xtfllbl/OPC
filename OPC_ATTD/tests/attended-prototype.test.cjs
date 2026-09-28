const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
function environment(){
    const storage=new Map();
    const context=vm.createContext({window:{},sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
        document:{getElementById:()=>null,addEventListener:()=>{}},URLSearchParams,console});
    vm.runInContext(fs.readFileSync(path.join(root,'js/attended_demo.js'),'utf8'),context);
    vm.runInContext(fs.readFileSync(path.join(root,'js/batch_reports.js'),'utf8'),context);
    return {context,demo:context.window.AttendedDemo};
}
test('追加授权更新持有金额，刷新结果页不重复追加',()=>{
    const {demo}=environment();
    const operation={operationId:'increment-1',action:'Auth-Incremental',sourceId:'attd_001038',amountCents:100,invoice:'900001'};
    demo.record(operation);demo.record(operation);
    assert.equal(demo.find('attd_001038').amount,36);
    assert.equal(demo.eligible('Capture').length,12);
});
test('Capture 排除原授权，Void 退款和现金 Void 均不计入结算',()=>{
    const {demo,context:c}=environment();
    demo.record({operationId:'capture-1',action:'Capture',sourceId:'attd_001038',amountCents:6000,invoice:'900002'});
    assert.equal(demo.eligible('Capture').length,11);
    const transactions=demo.toBatch('current').settlementList;
    assert.equal(c.summarizeBatchCardTransactions(transactions).cardNet,31765);
    assert.equal(c.summarizeBatchCardTransactions(transactions).included.find(t=>t.type==='REFUND').settlement,'negative');
    demo.record({operationId:'void-1',action:'Void',sourceId:'attd_C000007',amountCents:15});
    assert.equal(c.summarizeBatchCash(demo.toBatch('current').settlementList).netAmount,0);
    assert.equal(c.getBatchSettlementAmount({transType:'VOID REFUND',amount:1000}),0);
});
test('结算生成上批次快照，未完成预授权仍可寻单',()=>{
    const {demo}=environment();
    assert.equal(demo.closeBatch(),'2071');
    assert.equal(demo.toBatch('last').summary.settleStatus,'CLOSED');
    assert.equal(demo.toBatch('current').settlementList.length,0);
    assert.equal(demo.eligible('Capture').length,12);
    demo.record({operationId:'after-close',action:'Capture',sourceId:'attd_001038',amountCents:3500,invoice:'900003'});
    assert.equal(demo.toBatch('last').settlementList.find(t=>t.receiptNo==='001038').status,'OPEN AUTH');
    assert.equal(demo.toBatch('current').settlementList[0].transType,'CAPTURE');
});
test('现金付款归入 Cash Summary，空卡批次仍显示三个类型',()=>{
    const {demo,context:c}=environment();
    demo.record({operationId:'cash-sale',action:'Sale',amountCents:200,invoice:'C900001',paymentMethod:'cash'});
    assert.equal(c.summarizeBatchCash(demo.toBatch('current').settlementList).netAmount,215);
    assert.deepEqual(Array.from(c.summarizeBatchCardTransactions([]).included,r=>r.type),['SALE','REFUND','CAPTURE']);
});

test('Tip Adjust 仅包含当前批次支持后调的银行卡 Sale/Capture',()=>{
    const {demo}=environment();
    assert.deepEqual(Array.from(demo.eligible('Tip Adjust'),t=>t.invoice),['001051','001048','001019']);
    for(const [method,supported] of [['cash',true],['debit',true],['qr',true],['card',false]])
        demo.record({operationId:`excluded-${method}`,action:'Sale',amountCents:1000,invoice:'X',paymentMethod:method,tipAdjustSupported:supported});
    assert.equal(demo.eligible('Tip Adjust').length,3);
    demo.record({operationId:'credit',action:'Sale',amountCents:1100,tipCents:100,invoice:'new',tipAdjustSupported:true});
    assert.equal(demo.eligible('Tip Adjust').length,4);
    demo.closeBatch();assert.equal(demo.eligible('Tip Adjust').length,0);
});
test('最终小费覆盖：允许降低和零；确认原值也算处理，重复确认不记第二次',()=>{
    const {demo,context}=environment();
    function set(tipCents){const t=demo.find('attd_001051');return demo.adjustTip({id:t.id,batchId:t.batchId,revision:t.tipRevision||0,tipCents});}
    assert.equal(demo.pendingTips().length,3);
    set(65);assert.equal(demo.pendingTips().length,2);
    assert.equal(set(65).tipRevision,1);
    assert.equal(set(1000).amount,114);
    assert.equal(set(500).amount,109);
    assert.equal(set(0).amount,104);
    const receipt=demo.receipt('attd_001051');
    assert.equal(receipt.transactionAmountCents,10400);assert.equal(receipt.tipCents,0);assert.equal(receipt.amountCents,10400);
    assert.equal(context.summarizeBatchCardTransactions(demo.toBatch('current').settlementList).cardNet,25700);
    const row=demo.toBatch('current').settlementList.find(t=>t.receiptNo==='001051');
    assert.equal(row.tipCents,0);assert.equal(row.amount,10400);
});
test('存储失败保留金额/待处理状态，重试只提交一次',()=>{
    const {demo,context}=environment();
    const original=context.sessionStorage.setItem;context.sessionStorage.setItem=()=>{throw Error('disk full');};
    const request={id:'attd_001019',batchId:'2071',revision:0,tipCents:500};
    assert.throws(()=>demo.adjustTip(request),/Unable to save/);
    assert.equal(demo.find(request.id).amount,25);assert.equal(demo.pendingTips().length,3);
    context.sessionStorage.setItem=original;demo.adjustTip(request);
    assert.equal(demo.find(request.id).amount,30);assert.equal(demo.pendingTips().length,2);
});
test('保存前重验撤销、关批与版本变化，历史批次金额不变',()=>{
    const {demo}=environment();
    const request={id:'attd_001019',batchId:'2071',revision:0,tipCents:500};
    demo.adjustTip(request);
    assert.throws(()=>demo.adjustTip({...request,tipCents:100}),/changed/);
    demo.record({operationId:'void-capture',action:'Void',sourceId:request.id,amountCents:3000});
    assert.throws(()=>demo.adjustTip({...request,revision:1}),/no longer/);
    demo.closeBatch();
    const closed=demo.toBatch('last').settlementList.find(t=>t.receiptNo==='001051').amount;
    assert.throws(()=>demo.adjustTip({id:'attd_001051',batchId:'2071',revision:0,tipCents:300}),/no longer/);
    assert.equal(demo.toBatch('last').settlementList.find(t=>t.receiptNo==='001051').amount,closed);
});
test('Capture 继承支持能力，新增 Sale 留存金额分项，批次小费等于最终值',()=>{
    const {demo}=environment();
    demo.record({operationId:'captip',action:'Capture',sourceId:'attd_001038',amountCents:3500,invoice:'C1'});
    assert(demo.eligible('Tip Adjust').some(t=>t.id==='attd_captip'));
    demo.record({operationId:'newtip',action:'Sale',amountCents:11440,tipCents:1000,feeCents:440,cashEquivalentCents:10000,tipAdjustSupported:true,invoice:'S1'});
    assert.equal(demo.receipt('attd_newtip').transactionAmountCents,10440);
    demo.adjustTip({id:'attd_newtip',batchId:'2071',revision:0,tipCents:500});
    assert.equal(demo.receipt('attd_newtip').amountCents,10940);
    assert.equal(demo.toBatch('current').settlementList.reduce((n,t)=>n+(t.tipCents||0),0),1565);
});
