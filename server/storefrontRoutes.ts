import type { Express } from 'express';
import { z } from 'zod';
import { analyzeStore } from './audit';
import { shopAudit } from './shopMcp';
import { demoAudit } from './demo';
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
  app.get('/api/monitor/status',(_req,res)=>res.json({configured:!!process.env.MONITORED_STORE_URL,cronProtected:!!process.env.CRON_SECRET,persistentHistory:false,schedule:'0 9 * * *',note:'Vercel deployment and environment configuration required. No historical snapshots are stored in this MVP.'}));
  app.get('/api/cron',async(req,res)=>{
    if(!process.env.CRON_SECRET||req.headers.authorization!==`Bearer ${process.env.CRON_SECRET}`) {res.status(401).json({error:'Cron authorization required.'});return;}
    if(!process.env.MONITORED_STORE_URL) {res.status(503).json({error:'MONITORED_STORE_URL is not configured.'});return;}
    try {res.set('Cache-Control','no-store').json({audit:await shopAudit(process.env.MONITORED_STORE_URL),persistent:false});}
    catch(e){res.status(422).json({error:e instanceof Error?e.message:'Refresh failed.'});}
  });
}
