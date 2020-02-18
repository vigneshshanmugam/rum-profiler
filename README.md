# rum-profile-js

Sampling profile code that can be used to output the traces of any website.

The code is based on the Experimental [JS Self Profiling API](https://github.com/WICG/js-self-profiling)

### How to run the code

The API is experimental, Its available only on Chrome behind a flag `--enable-blink-features=ExperimentalJSProfiler`.You can also head to chrome://flags/#enable-experimental-web-platform-features and enable it.

1. Copy the below snippet of code and paste inside script tags in the head of
   any web page. The code should be placed in the head to start observing for
   long tasks as the buffered flag is not supported yet for long tasks.

```
(async()=>{let t=1,e=[];const n=new PerformanceObserver(n=>{const r=n.getEntries();for(const n of r)e.push({id:`${t}`,type:n.entryType,name:n.name,start:Math.round(n.startTime),end:Math.round(n.startTime+n.duration),duration:Math.round(n.duration)}),t++});n.observe({type:"longtask",buffered:!0});const r=await performance.profile({categories:["js"],sampleInterval:1,sampleBufferSize:Number.MAX_SAFE_INTEGER});async function o(){n.disconnect();const t=function(t){const n={};for(const r of t.samples){const o=Math.round(r.timestamp);for(const a of e){const{start:e,name:c,type:i,id:u,end:f,duration:d}=a;if(o>=e&&o<=f){n[u]||(n[u]={name:c,type:i,start:e,end:f,duration:d,culprits:[]});const a=s(t,r.stackId);n[u].culprits.push({time:o,stackId:r.stackId,stack:a})}}}return function(t,e){Object.keys(t).forEach(n=>{const{culprits:r,start:o,end:a}=t[n],s=[];let i=o;for(let t=0,n=1;n<r.length+1;t++,n++){let o=r[t],u=r[n];for(;u&&u.stackId===o.stackId;)n++,o=r[++t],u=r[n];const f=n===r.length,d=f?o.time-i+(a-o.time):o.time-i;s.push({totalTime:d,frames:c(e,o.stack)}),i=o.time}t[n].culprits=s})}(n,t),n}(await r.stop());try{const e="https://rum-profiler.now.sh",n=`${e}/flamegraph`,r=await fetch(n,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(t),mode:"cors",redirect:"follow"}),o=`${e}/trace/${await r.text()}`;console.log("%c Open this link in new tab to see the profiler data - "+o,"color: red"),window.open(o,"_blank")}catch(t){console.error("Failed to generate flamegraphs data because of an error",t)}}function a(t,e){return function(t,e){let{name:n,line:r,column:o,resourceId:a}=e;if(!n&&!r&&!o)return"unknown";n||(n="anonymous");if(!r||!o)return`${n} (native code)`;const s=function(t,e){return t.resources[e]}(t,a);return`${n} (${s}:${r}:${o})`}(t,function(t,e){return t.frames[e]}(t,e.frameId))}function s(t,e){return t.stacks[e]}function c(t,e,n=[]){if(!e)return n;const{parentId:r}=e;if(null!=r){return n.unshift(a(t,e)),c(t,s(t,r),n)}return n.unshift(a(t,e)),n}window.addEventListener("load",()=>o())})()
```

2. Reload the web page and check your dev-tools console for the link to the generated trace report.

3. You can use [Chrome Local Overrides](https://developers.google.com/web/updates/2018/01/devtools#overrides) feature to insert the script in any website.

### How it runs

1. The profiler is started as soon as the script is run and starts capturing JS stack traces every 1 ms based on the samplingInterval.

2. The profiler is stopped on the page load and the traces are combined to generates
   the flamegrap data.
