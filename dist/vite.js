const e=`form-state-tools:snapshot`,t=`virtual:form-state-tools/mount`,n=`\0`+t,r=[`virtual:tanstack-start-dev-client-entry`,`virtual:tanstack-start-client-entry`];function i(i={}){let{enabled:a,clientEntry:o}=i,s=`/`,c=e=>{let t=e.split(`?`)[0]??e;return o?t.includes(o):r.some(e=>t.includes(e))};return{name:`form-state-tools`,apply:a===void 0?`serve`:()=>a,enforce:`pre`,configResolved(e){s=e.base},resolveId(e){return e===t?n:void 0},load(e){return e===n?`import { mountFormDock } from 'form-state-tools/runtime';
mountFormDock();
`:void 0},transform(e,t){return!(t.includes(`node_modules`)||e.includes(`__fstMount`))&&c(t)?{code:e+`
import { mountFormDock as __fstMount } from 'form-state-tools/runtime';
__fstMount();
`,map:null}:void 0},transformIndexHtml:{order:`post`,handler(){return o?[]:[{tag:`script`,attrs:{type:`module`,src:`${s.replace(/\/$/,``)}/@id/${t}`},injectTo:`body`}]}},configureServer(t){t.ws.on(e,n=>{t.ws.send(e,n)})}}}export{i as default};