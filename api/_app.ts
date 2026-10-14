import express from 'express';
import { registerStorefrontRoutes } from '../server/storefrontRoutes';
const app=express();
app.use(express.json({limit:'64kb'}));
registerStorefrontRoutes(app);
export default app;
