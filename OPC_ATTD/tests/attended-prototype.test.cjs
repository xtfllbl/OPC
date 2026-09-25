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
