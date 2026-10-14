import type { IncomingMessage, ServerResponse } from 'node:http';
export default function health(_req:IncomingMessage,res:ServerResponse) {res.setHeader('Content-Type','application/json');res.statusCode=200;res.end(JSON.stringify({status:'ok'}));}
