function s(...e){return e.filter(Boolean).join(":")}var p=async(e,n,m)=>(await e.incr(s(`mq${m}`,n,"count"))).toString(),g=e=>{e.prefix?e.prefix=`-${e.prefix}`:e.prefix="";let n=new Map,m=async()=>await p(e.redisClient,e.name,e.prefix),u=async(r,t)=>await e.redisClient.lPos(s(`mq${e.prefix}`,e.name,t,"wait"),r),c=e.redisClient.duplicate(),f=e.redisClient.duplicate();return f.connect(),c.connect().then(()=>{e.redisClient.publish(`mq${e.prefix}`,JSON.stringify({event:"options",name:e.name,minTime:e.minTime}))}),f.subscribe(`mq${e.prefix}`,async r=>{let t=JSON.parse(r);if(t.name===e.name&&t.event==="start"){let a=n.get(t.id);a&&(a.func().finally(()=>{e.redisClient.publish(`mq${e.prefix}`,JSON.stringify({...t,event:"finish"}))}),n.delete(t.id))}}),{add:async(r,t)=>{let a=t?.id||await m();return await e.redisClient.rPush(s(`mq${e.prefix}`,e.name,t?.groupName,"wait"),a),new Promise((l,o)=>{n.set(a.toString(),{func:async()=>l(await r().catch(o))}),e.redisClient.publish(`mq${e.prefix}`,JSON.stringify({event:"add",name:e.name,groupName:t?.groupName,id:a}))})},genId:m,getQueuePosition:u}};import{Queue as x}from"async-await-queue";import{setTimeout as d}from"timers/promises";var y=async e=>{e.prefix?e.prefix=`-${e.prefix}`:e.prefix="";let n=e.redisClient,m=new Map,u=n.duplicate();await u.connect();let c=[];for await(let f of u.scanIterator({MATCH:`mq${e.prefix}:*`}))c.push(f);c.length&&(await n.del(c),c=[]),await u.subscribe(`mq${e.prefix}`,async f=>{let i=JSON.parse(f);if(i.event==="options"){if(m.has(i.name))return;m.set(i.name,{minTime:i.minTime,localQueue:new x(1)});return}let r=m.get(i.name),t=r?.localQueue;!r||!t||t.run(async()=>{if(i.event==="add"){let a=s(`mq${e.prefix}`,i.name,i.groupName,"active"),l=s(`mq${e.prefix}`,i.name,i.groupName,"wait");if(await n.lLen(a))return;await n.lRem(l,1,i.id),await n.rPush(a,i.id),r.minTime&&await d(r.minTime),n.publish(`mq${e.prefix}`,JSON.stringify({...i,event:"start"}))}if(i.event==="finish"){let a=s(`mq${e.prefix}`,i.name,i.groupName,"active");await n.lRem(a,1,i.id);let l=s(`mq${e.prefix}`,i.name,i.groupName,"wait"),o=await n.lPop(l);o&&(await n.rPush(a,o),r.minTime&&await d(r.minTime),n.publish(`mq${e.prefix}`,JSON.stringify({...i,id:o,event:"start"})))}})})};export{g as createQueue,y as createQueueProcessor};
//# sourceMappingURL=index.mjs.map