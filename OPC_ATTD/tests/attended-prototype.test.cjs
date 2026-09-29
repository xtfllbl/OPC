const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
function environment(storage=new Map()){
    const context=vm.createContext({window:{},sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
        document:{getElementById:()=>null,addEventListener:()=>{}},URLSearchParams,console});
    vm.runInContext(fs.readFileSync(path.join(root,'js/attended_demo.js'),'utf8'),context);
    vm.runInContext(fs.readFileSync(path.join(root,'js/batch_reports.js'),'utf8'),context);
    return {context,demo:context.window.AttendedDemo,storage};
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
    const before=c.summarizeBatchCardTransactions(demo.toBatch('current').settlementList).cardNet;
    demo.record({operationId:'capture-1',action:'Capture',sourceId:'attd_001038',amountCents:6000,invoice:'900002'});
    assert.equal(demo.eligible('Capture').length,11);
    const transactions=demo.toBatch('current').settlementList;
    assert.equal(c.summarizeBatchCardTransactions(transactions).cardNet,before+6000);
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

test('Tip Adjust 仅包含当前批次支持后调的银行卡 Sale，排除 Capture',()=>{
    const {demo}=environment();
    assert.equal(demo.eligible('Tip Adjust').length,20);
    assert(demo.eligible('Tip Adjust').every(t=>t.kind==='payment'));
    assert(!demo.eligible('Tip Adjust').some(t=>t.invoice==='001019'));
    for(const [method,supported] of [['cash',true],['debit',true],['qr',true],['card',false]])
        demo.record({operationId:`excluded-${method}`,action:'Sale',amountCents:1000,invoice:'X',paymentMethod:method,tipAdjustSupported:supported});
    assert.equal(demo.eligible('Tip Adjust').length,20);
    demo.record({operationId:'credit',action:'Sale',amountCents:1100,tipCents:100,invoice:'new',tipAdjustSupported:true});
    assert.equal(demo.eligible('Tip Adjust').length,21);
    demo.closeBatch();assert.equal(demo.eligible('Tip Adjust').length,0);
});
test('保存小费允许覆盖、降低和零，执行前不改变交易、报表或小票金额',()=>{
    const {demo,context}=environment();
    demo.record({operationId:'existing-tip',action:'Sale',amountCents:10465,tipCents:65,invoice:'EX1',tipAdjustSupported:true});
    const before=context.summarizeBatchCardTransactions(demo.toBatch('current').settlementList).cardNet;
    function set(tipCents){const t=demo.find('attd_existing-tip');return demo.adjustTip({id:t.id,batchId:t.batchId,revision:t.tipRevision||0,tipCents});}
    assert.equal(demo.pendingTips().length,11);
    set(65);assert.equal(demo.pendingTips().length,10);
    assert.equal(set(65).tipRevision,1);
    assert.equal(set(1000).tipDraftCents,1000);
    assert.equal(set(500).tipDraftCents,500);
    assert.equal(set(0).tipDraftCents,0);
    assert.equal(demo.find('attd_existing-tip').amount,104.65);
    assert.equal(demo.receipt('attd_existing-tip').tipCents,65);
    assert.equal(context.summarizeBatchCardTransactions(demo.toBatch('current').settlementList).cardNet,before);
    assert.equal(demo.adjustedTips().length,11);
    assert.equal(demo.processTips().length,11);
    const receipt=demo.receipt('attd_existing-tip');
    assert.equal(receipt.transactionAmountCents,10400);assert.equal(receipt.tipCents,0);assert.equal(receipt.amountCents,10400);
    assert.equal(context.summarizeBatchCardTransactions(demo.toBatch('current').settlementList).cardNet,before-65);
    const row=demo.toBatch('current').settlementList.find(t=>t.receiptNo==='EX1');
    assert.equal(row.tipCents,0);assert.equal(row.amount,10400);
});
test('存储失败保留金额/待处理状态，重试只提交一次',()=>{
    const {demo,context}=environment();
    const original=context.sessionStorage.setItem;context.sessionStorage.setItem=()=>{throw Error('disk full');};
    const request={id:'attd_001048',batchId:'2071',revision:0,tipCents:500};
    assert.throws(()=>demo.adjustTip(request),/Unable to save/);
    assert.equal(demo.find(request.id).amount,130);assert.equal(demo.pendingTips().length,10);
    context.sessionStorage.setItem=original;demo.adjustTip(request);
    assert.equal(demo.find(request.id).amount,130);assert.equal(demo.find(request.id).tipDraftCents,500);
    assert.equal(demo.pendingTips().length,9);
    demo.processTips();assert.equal(demo.find(request.id).amount,135);
});
test('保存前重验撤销、关批与版本变化，历史批次金额不变',()=>{
    const {demo}=environment();
    const request={id:'attd_001048',batchId:'2071',revision:0,tipCents:500};
    demo.adjustTip(request);
    assert.throws(()=>demo.adjustTip({...request,tipCents:100}),/changed/);
    demo.record({operationId:'void-sale',action:'Void',sourceId:request.id,amountCents:13500});
    assert.throws(()=>demo.adjustTip({...request,revision:1}),/no longer/);
    demo.closeBatch();
    const closed=demo.toBatch('last').settlementList.find(t=>t.receiptNo==='001051').amount;
    assert.throws(()=>demo.adjustTip({id:'attd_001051',batchId:'2071',revision:0,tipCents:300}),/no longer/);
    assert.equal(demo.toBatch('last').settlementList.find(t=>t.receiptNo==='001051').amount,closed);
});
test('Capture 不允许后调，新增 Sale 留存金额分项，批次仍保留 Capture',()=>{
    const {demo}=environment();
    const initialTips=demo.toBatch('current').settlementList.reduce((n,t)=>n+(t.tipCents||0),0);
    demo.record({operationId:'captip',action:'Capture',sourceId:'attd_001038',amountCents:3500,invoice:'C1'});
    assert(!demo.eligible('Tip Adjust').some(t=>t.id==='attd_captip'));
    assert.throws(()=>demo.adjustTip({id:'attd_captip',batchId:'2071',revision:0,tipCents:100}),/no longer/);
    assert(demo.toBatch('current').settlementList.some(t=>t.id==='attd_captip'&&t.amount===3500));
    demo.record({operationId:'newtip',action:'Sale',amountCents:11440,tipCents:1000,feeCents:440,cashEquivalentCents:10000,tipAdjustSupported:true,invoice:'S1'});
    assert.equal(demo.receipt('attd_newtip').transactionAmountCents,10440);
    demo.adjustTip({id:'attd_newtip',batchId:'2071',revision:0,tipCents:500});
    assert.equal(demo.receipt('attd_newtip').amountCents,11440);
    demo.processTips();
    assert.equal(demo.receipt('attd_newtip').amountCents,10940);
    assert.equal(demo.toBatch('current').settlementList.reduce((n,t)=>n+(t.tipCents||0),0),initialTips+500);
});


const demoKey='opc-attended-demo-v1';
function oldSession(){
    const {storage}=environment();
    const state=JSON.parse(storage.get(demoKey));
    state.rows=state.rows.filter(t=>!/^0011[01][0-9]$/.test(t.invoice));
    delete state.tipSamplesVersion;
    delete state.tipWorkflowVersion;
    state.rows.forEach(t=>{delete t.tipDraftCents;delete t.tipSavedAt;});
    return state;
}
test('新版演示为20笔Sale、10笔Tipped和10笔Un-tipped，已保存零小费也算Tipped',()=>{
    const {demo}=environment();
    const eligible=demo.eligible('Tip Adjust');
    assert.equal(eligible.length,20);
    assert.equal(demo.adjustedTips().length,10);
    assert.equal(demo.pendingTips().length,10);
    assert.equal(new Set(eligible.map(t=>t.id)).size,20);
    assert(eligible.some(t=>t.tipSavedAt&&t.tipDraftCents===0));
    assert(demo.pendingTips().every(t=>t.tipCents===0&&Math.round(t.amount*100)===t.transactionAmountCents));
    assert.equal(demo.eligible('Capture').length,12);
});
test('旧示例的未保存小费归零并同步总额，保留已保存、已执行、新交易和历史金额',()=>{
    const {demo,storage}=environment();
    demo.record({operationId:'keep-tip',action:'Sale',amountCents:1200,tipCents:200,invoice:'NEW',tipAdjustSupported:true});
    const old=JSON.parse(storage.get(demoKey));
    delete old.untippedSamplesVersion;
    for(const [id,tip] of [['attd_001105',125],['attd_001113',375],['attd_001051',65],['attd_001048',1000]]){
        const row=old.rows.find(t=>t.id===id);
        row.tipCents=tip;row.amount=(row.transactionAmountCents+tip)/100;
    }
    const saved=old.rows.find(t=>t.id==='attd_001051');
    saved.tipDraftCents=300;saved.tipSavedAt='2026-09-29T00:00:00Z';saved.tipRevision=1;
    const processed=old.rows.find(t=>t.id==='attd_001048');
    processed.tipProcessedAt='2026-09-29T00:00:00Z';
    old.tipAdjustments=[{id:processed.id,tipCents:1000}];
    storage.set(demoKey,JSON.stringify(old));
    const updated=environment(storage).demo;
    for(const id of ['attd_001105','attd_001113']){
        const row=updated.find(id);
        assert.equal(row.tipCents,0);assert.equal(Math.round(row.amount*100),row.transactionAmountCents);
    }
    const after=JSON.parse(storage.get(demoKey));
    for(const before of old.rows.filter(t=>!['attd_001105','attd_001113'].includes(t.id)))
        assert.deepEqual(after.rows.find(t=>t.id===before.id),before);
    assert.deepEqual(after.last,old.last);
    assert.deepEqual(after.tipAdjustments,old.tipAdjustments);
    environment(storage);
    assert.deepEqual(JSON.parse(storage.get(demoKey)),after);
});
test('旧会话保留两笔已调整金额及历史，补8笔已调整+10笔未调整，刷新不重复补数',()=>{
    const old=oldSession();
    for(const [id,tip] of [['attd_001051',300],['attd_001048',200]]){
        const row=old.rows.find(t=>t.id===id);
        row.tipCents=tip;row.amount=(row.transactionAmountCents+tip)/100;
        row.tipConfirmedAt='2026-09-28T08:00:00Z';row.tipRevision=2;
    }
    old.tipAdjustments=[{id:'attd_001051',tipCents:300,financialChange:true}];
    const storage=new Map([[demoKey,JSON.stringify(old)]]);
    let {demo}=environment(storage);
    assert.equal(demo.eligible('Tip Adjust').length,20);
    assert.equal(demo.pendingTips().length,10);
    for(const before of old.rows){
        const after={...demo.find(before.id)};
        if(before.tipConfirmedAt){assert.equal(after.tipDraftCents,before.tipCents);assert.equal(after.tipSavedAt,before.tipConfirmedAt);}
        delete after.tipDraftCents;delete after.tipSavedAt;
        assert.equal(JSON.stringify(after),JSON.stringify(before));
    }
    assert.deepEqual(JSON.parse(storage.get(demoKey)).tipAdjustments,old.tipAdjustments);
    const pending=demo.pendingTips()[0];
    demo.adjustTip({id:pending.id,batchId:pending.batchId,revision:0,tipCents:400});
    demo=environment(storage).demo;
    assert.equal(demo.eligible('Tip Adjust').length,20);
    assert.equal(demo.pendingTips().length,9);
    assert.equal(demo.find(pending.id).tipDraftCents,400);
    assert.equal(demo.find(pending.id).tipCents,pending.tipCents);
    demo.closeBatch();
    demo=environment(storage).demo;
    assert.equal(demo.eligible('Tip Adjust').length,0);
    assert.equal(demo.toBatch('current').settlementList.length,0);
});

test('全部Tipped执行后移出工作列表，刷新不回填，不重复处理且原交易仍保留',()=>{
    const {demo,storage}=environment();
    const existingCount=demo.rows().length;
    const target=demo.pendingTips().find(t=>t.tipCents===0);
    demo.adjustTip({id:target.id,batchId:target.batchId,revision:target.tipRevision||0,tipCents:0});
    const saved=environment(storage).demo;
    assert.equal(saved.adjustedTips().length,11);
    const processed=saved.processTips();
    assert.equal(processed.length,11);
    assert.equal(saved.eligible('Tip Adjust').length,9);
    assert.equal(saved.rows().length,existingCount);
    for(const t of processed){assert(saved.find(t.id).tipProcessedAt);assert(!saved.eligible('Tip Adjust').some(row=>row.id===t.id));}
    assert.equal(saved.processTips().length,0);
    const reloaded=environment(storage).demo;
    assert.equal(reloaded.eligible('Tip Adjust').length,9);
    assert.equal(reloaded.adjustedTips().length,0);
    assert.equal(reloaded.receipt(target.id).tipCents,0);
    assert.throws(()=>reloaded.adjustTip({id:target.id,batchId:target.batchId,revision:reloaded.find(target.id).tipRevision,tipCents:100}),/no longer/);
    assert.equal(JSON.parse(storage.get(demoKey)).tipAdjustments.length,11);
});

test('Close Batch自动执行已保存调整后快照，Un-tipped保留原金额且不带入新批次',()=>{
    const {demo,context}=environment();
    const originalNet=context.summarizeBatchCardTransactions(demo.toBatch('current').settlementList).cardNet;
    const target=demo.find('attd_001051'),untouched=demo.find('attd_001048');
    demo.adjustTip({id:target.id,batchId:target.batchId,revision:0,tipCents:800});
    assert.equal(demo.pendingTips().length,9);
    assert.equal(demo.adjustedTips().length,11);
    const batchId=demo.closeBatch();
    const last=demo.toBatch('last');
    assert.equal(batchId,'2071');
    assert.equal(last.settlementList.find(t=>t.id===target.id).amount,11200);
    assert.equal(last.settlementList.find(t=>t.id===target.id).tipCents,800);
    assert.equal(last.settlementList.find(t=>t.id===untouched.id).amount,13000);
    assert.equal(last.settlementList.find(t=>t.id===untouched.id).tipCents,0);
    assert.equal(context.summarizeBatchCardTransactions(last.settlementList).cardNet,originalNet+800);
    assert.equal(demo.eligible('Tip Adjust').length,0);
    assert.equal(demo.adjustedTips().length,0);
    assert.equal(demo.toBatch('current').summary.batchId,'2072');
    assert.equal(demo.toBatch('current').settlementList.length,0);
});
test('升级前已关批的会话保持空新批次，不补回旧批次或改写历史',()=>{
    const old=oldSession();old.last=old.rows.map(t=>({...t}));old.lastBatchId='2071';old.batchId='2072';
    const storage=new Map([[demoKey,JSON.stringify(old)]]);
    const {demo}=environment(storage);
    assert.equal(demo.rows().length,old.rows.length);
    assert.equal(demo.toBatch('current').settlementList.length,0);
    assert.equal(demo.eligible('Tip Adjust').length,0);
    assert.deepEqual(JSON.parse(storage.get(demoKey)).last,old.last);
});
