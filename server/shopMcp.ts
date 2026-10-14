import * as cheerio from 'cheerio';
import type { Audit, Product } from '../shared/storefront';
import { readiness } from '../shared/storefront';
import { publicFetch } from './publicFetch';
import { scoreProducts, analyzeStore } from './audit';
const SHOP='https://mcp.shop.com/';
const meta={'io.modelcontextprotocol/protocolVersion':'2026-07-28','io.modelcontextprotocol/clientInfo':{name:'agent-storefront-kit',version:'1.0.0'},'io.modelcontextprotocol/clientCapabilities':{}};
async function rpc(endpoint:string,method:string,params:Record<string,any>) {
  const official=endpoint===SHOP;
  const headers:Record<string,string>={'Content-Type':'application/json',Accept:'application/json, text/event-stream'};
  if(official) {headers['MCP-Protocol-Version']='2026-07-28';headers['Mcp-Method']=method;if(params.name) headers['Mcp-Name']=params.name;}
  const r=await publicFetch(endpoint,{method:'POST',body:JSON.stringify({jsonrpc:'2.0',id:crypto.randomUUID(),method,params:official?{...params,_meta:meta}:params}),headers});
  if(r.status>=400) throw new Error(`Shop MCP returned HTTP ${r.status}.`);
  const data=JSON.parse(r.text);
  if(data.error) throw new Error(data.error.message||'MCP request rejected.');
  if(data.result?.isError) throw new Error((data.result.content?.[0]?.text||'MCP tool returned an error.').slice(0,400));
  return data.result;
}
function contentOf(result:any) {if(result.structuredContent)return result.structuredContent;const text=result.content?.filter((c:any)=>c.type==='text').map((c:any)=>c.text).join('\n')||'';try{return JSON.parse(text);}catch{return{text};}}
function sameMerchant(a:string,b:string){try{return new URL(a).hostname.replace(/^www\./,'')===new URL(b).hostname.replace(/^www\./,'');}catch{return false;}}
export async function shopAudit(input:string,query='everyday essentials'):Promise<Audit> {
  const url=new URL(input.includes('://')?input:`https://${input}`);
  // Validate the requested target even though the first remote call goes to the fixed Shop endpoint.
  if(url.protocol!=='https:'||url.username||url.password||(url.port&&url.port!=='443')) throw new Error('Use a public HTTPS storefront URL.');
  try {
    const discovery=await rpc(SHOP,'tools/list',{});const tools=discovery.tools||[];
    if(!tools.some((t:any)=>t.name==='search_catalog')) throw new Error('Shop MCP catalog tool unavailable.');
    const result=contentOf(await rpc(SHOP,'tools/call',{name:'search_catalog',arguments:{catalog:{query,filters:{shops:[url.hostname.replace(/^www\./,'')]},context:{address_country:'US',currency:'USD'},pagination:{limit:16}}}}));
    const products:Product[]=(result.products||[]).filter((p:any)=>{const v=p.variants?.[0];return sameMerchant(v?.url||p.url||'',url.href)&&(!v?.seller?.url||sameMerchant(v.seller.url,url.href));}).map((p:any)=>{
      const v=p.variants?.[0]||{};const price=v.price||p.price_range?.min;const currency=price?.currency||'';
      const decimals=currency?new Intl.NumberFormat('en',{style:'currency',currency}).resolvedOptions().maximumFractionDigits??2:2;
      const desc=p.description?.plain||p.description?.html||'';
      return {id:String(p.id),title:String(p.title),description:desc?cheerio.load(desc).text():undefined,price:typeof price?.amount==='number'?price.amount/10**decimals:null,currency,available:typeof v.availability?.available==='boolean'?v.availability.available:null,variants:p.variants?.map((v:any)=>v.title||(v.options||[]).map((o:any)=>o.label).join(' / ')||''),image:v.media?.find((m:any)=>m.type==='image')?.url||p.media?.find((m:any)=>m.type==='image')?.url,url:v.url||p.url,source:'Shop MCP · live featured variant'};
    });
    if(!products.length) throw new Error('Shop MCP returned no exact merchant-domain matches. Public HTML fallback used; unrelated catalog results excluded.');
    let policyText='';let policyError='';
    try {const endpoint=`${url.origin}/api/mcp`;const d=await rpc(endpoint,'tools/list',{});if(d.tools?.some((t:any)=>t.name==='search_shop_policies_and_faqs')){policyText=JSON.stringify(contentOf(await rpc(endpoint,'tools/call',{name:'search_shop_policies_and_faqs',arguments:{query:'What are your shipping delivery and return refund policies?',policy_types:['shipping','refund']}})));}} catch(e){policyError=e instanceof Error?e.message:'Policy lookup unavailable.';}
    const warnings=(result.messages||[]).filter((m:any)=>m.type==='warning').map((m:any)=>m.content).join(' ');
    const signals=scoreProducts(products,policyText,'Shop MCP · featured variants only');
    return {id:crypto.randomUUID(),url:url.href,name:url.hostname.replace(/^www\./,''),scannedAt:new Date().toISOString(),demo:false,products,signals,score:readiness(signals),rawText:JSON.stringify({products,policies:policyText?JSON.parse(policyText):null,warnings},null,2),mcp:{endpoint:SHOP,connected:true,tools:tools.map((t:any)=>t.name),error:[warnings,policyError].filter(Boolean).join(' ')||undefined},trace:[{tool:'discover_shop_mcp',detail:`Official Shop MCP: ${tools.length} tools discovered. No account or key.`,status:'complete'},{tool:'search_catalog',detail:`${products.length} exact merchant-domain matches. Featured variant prices converted from minor units. URLs retained exactly. No results cached.`,status:'complete'},{tool:'search_shop_policies_and_faqs',detail:policyText?'Merchant shipping/refund context retrieved.':policyError||'No policy context returned.',status:policyText?'complete':'warning'},{tool:'score_readiness',detail:`${signals.filter(s=>s.score===100).length}/8 checks passed. Coverage: live featured result set, not every variant or the full catalog.`,status:'complete'},...(warnings?[{tool:'shop_warning',detail:warnings,status:'warning'}]:[])]};
  } catch(e) {
    const error=e instanceof Error?e.message:'Shop MCP unavailable.';
    try {const audit=await analyzeStore(input);return {...audit,mcp:{endpoint:SHOP,connected:false,tools:[],error},trace:[{tool:'discover_shop_mcp',detail:error,status:'warning'},...audit.trace]};}
    catch(fallback){throw new Error(`${error} HTML fallback: ${fallback instanceof Error?fallback.message:'unavailable'}`);}
  }
}
