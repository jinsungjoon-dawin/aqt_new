import {Router } from 'express';
import tprojenv from '../model/tprojenv.js';

const router = Router() ;

router.get('/', async function (req, res, next) {
    const rdata = await tprojenv.find() ;
    res.json(rdata) ;
});

router.get('/perfsum/:tid', async function (req, res, next) {
  const rdata = await tprojenv.getPerfSum(req.params.tid) ;
  res.json(rdata) ;
});

export default router;
