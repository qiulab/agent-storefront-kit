import { lookup } from 'node:dns/promises';
import https from 'node:https';
import { isIP } from 'node:net';

function publicIP(ip: string) {
  if (isIP(ip) === 6) return !/^(::|fc|fd|fe[89ab]|ff)/i.test(ip) && !ip.includes('.');
  const [a,b] = ip.split('.').map(Number);
  return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && [0,168].includes(b)) || (a === 100 && b >= 64 && b <= 127) || (a === 198 && [18,19].includes(b)));
}
export async function publicFetch(input: string, options: { method?: string; body?: string; headers?: Record<string,string>; redirects?: number } = {}): Promise<{ text: string; status: number; url: string }> {
  const url = new URL(input.includes('://') ? input : `https://${input}`);
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443') || url.hostname === 'localhost') throw new Error('Use a public HTTPS storefront URL, without credentials or a custom port.');
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some(a => !publicIP(a.address))) throw new Error('Private and reserved network addresses are not allowed.');
  const address = addresses[0];
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method: options.method || 'GET', headers: { 'User-Agent': 'AgentStorefrontKit/1.0 (read-only commerce audit)', Accept: 'text/html,application/json', ...options.headers }, lookup: ((_host: string, _options: unknown, callback: Function) => callback(null, [{address: address.address, family: address.family}])) as any }, res => {
      if ([301,302,303,307,308].includes(res.statusCode || 0) && res.headers.location) {
        res.resume();
        if (options.method === 'POST' || (options.redirects || 0) >= 3) return reject(new Error('MCP redirects are not followed; use the canonical store domain.'));
        publicFetch(new URL(res.headers.location, url).href, { ...options, redirects: (options.redirects || 0) + 1 }).then(resolve,reject); return;
      }
      let text = ''; let size = 0;
      res.on('data', chunk => { size += chunk.length; if (size > 2_000_000) { req.destroy(); reject(new Error('Page exceeds the 2 MB audit limit.')); } else text += chunk.toString(); });
      res.on('end', () => resolve({ text, status: res.statusCode || 0, url: url.href }));
      res.on('error', reject);
    });
    req.setTimeout(12000, () => req.destroy(new Error('Storefront request timed out. Try another public product page.')));
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}
