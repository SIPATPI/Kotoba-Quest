# เมื่อผู้เล่นแตะคำตอบซ้ำ

ตัวอย่างนี้คัดจากตัวจัดเก็บข้อมูลจำลองและชุดทดสอบในโปรเจกต์ KOTOBA QUEST เพื่อแสดงว่าคำขอสี่ครั้งส่งผลต่อเกมครั้งเดียวได้อย่างไร

แต่ละการส่งคำตอบมี operationId ระบบจำลองจัดการคำขอตามลำดับและเก็บผลที่บันทึกแล้ว เมื่อพบ ID เดิม จะตรวจว่ารายละเอียดคำขอเหมือนเดิมหรือไม่ ถ้าเหมือนเดิมจะคืนผลที่เก็บไว้ ถ้าคำตอบเปลี่ยนไปจะปฏิเสธคำขอ

จาก server/local-store.cjs

```js
      const prepared=isKana?kana.prepare(method,input):game.prepare(method,input),receipt=current.receipts[prepared.operationId];
      if(receipt){if(receipt.fingerprint!==prepared.fingerprint)throw new Error('operationId conflict');return {result:structuredClone(receipt.result),replayed:true,timing:{readNetworkMs:0,computeMs:0,commitNetworkMs:0}};}
      const began=performance.now(),computed=isKana?kana.compute(current.kana,method,input):game.compute(current.state,prepared),computeMs=performance.now()-began;
```

จาก tests/local-game.test.cjs ชุดทดสอบนี้ใช้ผู้เล่นจำลองและเครื่องยนต์เกมภายในโปรเจกต์เต็ม

```js
test('four duplicate answers advance once and conflicting retries are refused',async()=>{
  const f=await fixture(),round=await vocabularyRound(f);
  const payload={...op(),sessionId:round.sessionId,turn:0,answerIndex:0};
  const answers=await Promise.all(Array.from({length:4},()=>f.store.call(f.token,'submitLearningAnswer',payload)));
  assert.equal(answers.filter(item=>!item.replayed).length,1);
  assert.equal((await f.call('getLearningSession',{sessionId:round.sessionId})).currentTurn,1);
  await assert.rejects(f.call('submitLearningAnswer',{...payload,answerIndex:1}),/operationId conflict/);
});
```

