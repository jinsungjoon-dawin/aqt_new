import {Router} from 'express';
import tperfcode from '../model/tperfcode.js';
import tperftest from '../model/tperftest.js';
 
const router = Router() ;

router.get('/', async function (req, res, next) {
    const rdata = await tperfcode.ttestlist() ;
    res.json(rdata) ;
});

router.get('/testde_list', async function (req, res, next) {
    // console.log("req.query.tid : " + req.query.tid);

    const rdata = await tperftest.ttestdelist(req) ;
    res.json(rdata) ;
});

export default router;
