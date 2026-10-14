import type { Express } from 'express';
import { z } from 'zod';
import { analyzeStore } from './audit';
import { shopAudit } from './shopMcp';
import { demoAudit } from './demo';
import { gatewayCompare, gatewayStatus } from './gatewayShopper';
const inputSchema=z.object({url:z.string().min(3).max(2000),shopify:z.boolean().optional(),query:z.string().max(200).optional()});
export function registerStorefrontRoutes(app:Express) {
  let active=0; const limits=new Map<string,{count:number,until:number}>();
  app.get('/api/demo',(_req,res)=>res.json(demoAudit()));
  app.post('/api/analyze',async(req,res)=>{
    const input=inputSchema.safeParse(req.body);
    if(!input.success) {res.status(400).json({error:'Enter a public HTTPS storefront URL.'});return;}
    const ip=req.ip||'unknown'; const current=limits.get(ip);const limit=current&&current.until>Date.now()?current:{count:0,until:Date.now()+60000}; limit.count++;limits.set(ip,limit);
    if(limits.size>2000) for(const[k,v] of limits) if(v.until<Date.now()) limits.delete(k);
    if(active>=4||limit.count>12) {res.status(429).json({error:'Too many scans. Please wait a minute.'});return;}
    active++;
    try {res.set('Cache-Control','no-store').json(await (input.data.shopify?shopAudit(input.data.url,input.data.query):analyzeStore(input.data.url)));}
    catch(e) {res.status(422).json({error:e instanceof Error?e.message:'The storefront could not be audited.'});}
    finally {active--;}
  });
  app.get('/api/gateway/status',(_req,res)=>res.json(gatewayStatus()));
  let shopperCount=0;let shopperReset=Date.now()+3600000;
  app.post('/api/shopper',async(req,res)=>{
    if(Date.now()>shopperReset){shopperCount=0;shopperReset=Date.now()+3600000;}
    if(shopperCount>=20){res.status(429).json({error:'Shopper comparison limit reached. Use the zero-call local simulation or try later.'});return;}
    const product=z.object({id:z.string().max(200),title:z.string().max(250),description:z.string().max(10000).optional(),price:z.number().finite().nullable(),currency:z.string().max(5),available:z.boolean().nullable(),source:z.string().max(100),image:z.string().max(2000).optional(),url:z.string().max(2000).optional(),variants:z.array(z.string().max(500)).max(100).optional()});
    const schema=z.object({audit:z.object({id:z.string(),url:z.string(),name:z.string(),scannedAt:z.string(),demo:z.boolean(),score:z.number(),rawText:z.string().max(100000),products:z.array(product).min(1).max(24),signals:z.array(z.object({key:z.enum(['pricing','stock','image','description','shipping','returns','variants','contact']),label:z.string().max(100),score:z.number(),evidence:z.string().max(1000),source:z.string().max(100),fix:z.string().max(1000)})).length(8),trace:z.array(z.object({tool:z.string(),detail:z.string(),status:z.string()})).max(20)}),steer:z.object({shipping:z.string().max(1000),returns:z.string().max(1000),stock:z.string().max(1000),guidance:z.string().max(1000),preferredProduct:z.string().max(200),budget:z.number().min(0).max(100000),hiddenProductIds:z.array(z.string()).max(24),discountEnabled:z.boolean(),question:z.string().min(1).max(500)})});
    const input=schema.safeParse(req.body);if(!input.success){res.status(400).json({error:'The shopper feed or question is too large or invalid.'});return;}
    shopperCount++;
    res.set('Cache-Control','no-store').json(await gatewayCompare(input.data.audit,input.data.steer));
  });
  app.get('/api/monitor/status',(_req,res)=>res.json({configured:!!process.env.MONITORED_STORE_URL,cronProtected:!!process.env.CRON_SECRET,persistentHistory:false,schedule:'0 9 * * *',note:'Vercel deployment and environment configuration required. No historical snapshots are stored in this MVP.'}));
  app.get('/api/cron',async(req,res)=>{
    if(!process.env.CRON_SECRET||req.headers.authorization!==`Bearer ${process.env.CRON_SECRET}`) {res.status(401).json({error:'Cron authorization required.'});return;}
    if(!process.env.MONITORED_STORE_URL) {res.status(503).json({error:'MONITORED_STORE_URL is not configured.'});return;}
    try {
      const audit=await shopAudit(process.env.MONITORED_STORE_URL,process.env.MONITORED_CATALOG_QUERY||'rain jacket');
      console.info('[Daily audit]',JSON.stringify({at:audit.scannedAt,store:audit.name,score:audit.score,products:audit.products.length,shopMcp:audit.mcp?.connected||false}));
      res.set('Cache-Control','no-store').json({audit,persistent:false});
    }
    catch(e){res.status(422).json({error:e instanceof Error?e.message:'Refresh failed.'});}
  });
}
