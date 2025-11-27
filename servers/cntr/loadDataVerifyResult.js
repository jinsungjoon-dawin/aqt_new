import {Router} from 'express';
import tdatacode from '../model/tdatacode.js';
import tdatatr from '../model/tdatatr.js';
import tdatasql from '../model/tdatasql.js';
 
const router = Router() ;

router.get('/', async function (req, res, next) {
    const rdata = await tdatacode.tdatalist() ;
    res.json(rdata) ;
});

router.get('/loaddata_list', async function (req, res, next) {
    // console.log("req.query.did : " + req.query.did);

    const rdata = await tdatatr.tdatachklist(req) ;
    res.json(rdata) ;
});

router.get('/loaddata_checkres', async function (req, res, next) {
    // console.log("req.query.did : " + req.query.did);

    const rdata = await tdatasql.tdatachkresult(req) ;
    res.json(rdata) ;
});


router.get('/loaddata_checkreslist', async function (req, res, next) {
    // console.log("req.query.did : " + req.query.did);

    const rdata = await tdatasql.tdatachkresultlist(req) ;
    res.json(rdata) ;
});

export default router;
