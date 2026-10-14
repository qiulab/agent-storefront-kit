import { describe,expect,it,vi,afterEach } from 'vitest';
import { gatewayCompare } from './gatewayShopper';
import { demoAudit } from './demo';
import { emptySteering } from '../shared/storefront';
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
describe('Gateway shopper',()=>{
  it('makes no call when Gateway is disabled',async()=>{vi.stubEnv('AI_GATEWAY_ENABLED','false');const f=vi.fn();vi.stubGlobal('fetch',f);const r=await gatewayCompare(demoAudit(),emptySteering);expect(r.engine).toBe('deterministic');expect(r.calls).toBe(0);expect(f).not.toHaveBeenCalled();});
  it('uses one call for both answers and keeps price grounded',async()=>{vi.stubEnv('AI_GATEWAY_ENABLED','true');vi.stubEnv('AI_GATEWAY_API_KEY','test-only-placeholder');const f=vi.fn().mockResolvedValue({ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({before:{productId:'tote',explanation:'Lowest verified price.'},after:{productId:'tote',explanation:'Discounted preview price.'}})}}],usage:{total_tokens:120}})});vi.stubGlobal('fetch',f);const r=await gatewayCompare(demoAudit(),{...emptySteering,discountEnabled:true});expect(r.engine).toBe('ai-gateway');expect(f).toHaveBeenCalledTimes(1);expect(r.after.effectivePrice).toBe(61.2);expect(JSON.parse(f.mock.calls[0][1].body).max_tokens).toBe(550);});
  it('rejects an invented product and falls back',async()=>{vi.stubEnv('AI_GATEWAY_ENABLED','true');vi.stubEnv('AI_GATEWAY_API_KEY','test-only-placeholder');vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({choices:[{message:{content:JSON.stringify({before:{productId:'invented',explanation:'Fake'},after:{productId:'invented',explanation:'Fake'}})}}]})}));const r=await gatewayCompare(demoAudit(),emptySteering);expect(r.engine).toBe('deterministic');expect(r.after.product?.id).toBe('tote');});
});
