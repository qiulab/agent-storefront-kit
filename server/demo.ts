import type { Audit, Product } from '../shared/storefront.js';
import { readiness } from '../shared/storefront.js';
import { scoreProducts } from './audit.js';
export function demoAudit(): Audit {
  const products:Product[]=[
    {id:'weekender',title:'The Everyday Weekender',description:'A durable canvas weekender made for short trips, everyday errands, and carrying everything comfortably.',variants:['Natural canvas'],price:128,currency:'USD',available:null,image:'/demo/canvas-pack.jpg',source:'Demo Product JSON-LD'},
    {id:'tote',title:'Canvas Utility Tote',description:'A roomy everyday tote with sturdy handles, thoughtful pockets, and hard-wearing cotton canvas.',variants:['Olive canvas'],price:48,currency:'USD',available:null,image:'/demo/canvas-tote.jpg',source:'Demo Product JSON-LD'},
    {id:'pack',title:'The Trail Daypack',description:'A lightweight daypack with adjustable straps and organized storage for the trail or your daily commute.',variants:['Charcoal'],price:94,currency:'USD',available:null,image:'/demo/daypack.jpg',source:'Demo Product JSON-LD'}
  ];
  const text='FIELDWORK SUPPLY\nThe Everyday Weekender — $128\nCanvas Utility Tote — $48\nThe Trail Daypack — $94\nThoughtfully made. Ready for the everyday.\nContact: hello@fieldwork.demo\n\nNo stock state, shipping terms, or return policy exposed in this fixture.';
  const signals=scoreProducts(products,'Contact: hello@fieldwork.demo','Demo fixture · Product JSON-LD');
  return {id:'demo-fieldwork',url:'https://fieldwork.demo',name:'Fieldwork Supply',scannedAt:new Date().toISOString(),demo:true,products,signals,score:readiness(signals),rawText:text,trace:[{tool:'fetch_storefront',detail:'Demo fixture loaded; no live network request.',status:'complete'},{tool:'extract_product_schema',detail:'3 products with price, image, description, and variant labels.',status:'complete'},{tool:'inspect_commerce_policies',detail:'Stock, shipping, and returns context not exposed.',status:'warning'},{tool:'score_readiness',detail:'5 of 8 deterministic checks passed; audited score 63/100.',status:'complete'}]};
}
