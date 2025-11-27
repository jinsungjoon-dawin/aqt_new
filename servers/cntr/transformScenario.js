import {Router} from 'express';
import tmigcode from '../model/tmigcode.js';
import tmigscene from '../model/tmigscene.js';

const router = Router() ;

router.get('/', async function (req, res, next) {
    const rdata = await tmigcode.ttranslist() ;
    res.json(rdata) ;
});

router.get('/transsc_list', async function (req, res, next) {
    // console.log("req.query.mid : " + req.query.mid);
    // console.log("req.query.wstat : " + req.query.wstat);

    const rdata = await tmigscene.ttranssclist(req) ;
    res.json(rdata) ;
});

router.post('/transsc_save', async function (req, res, next) {
    // console.log("Controller req body  : " + JSON.stringify(req.body));
    // console.log("post req body length : " + req.body.length);
    // console.log("post req body 0 mid : " + req.body[0].mid);
    // console.log("post req body 0 pkey : " + req.body[0].pkey);
    // console.log("post req body 0 actstst : " + req.body[0].actstst);
    // console.log("post req body 0 actendt : " + req.body[0].actendt);
    
    const rdata = await tmigscene.ttransscsave(JSON.stringify(req.body)) ;
    // console.log('rdata : ' + rdata);

    if(rdata === 1){
        // res.status(200).json({ message: '수정을 완료하였습니다.'}) ;
        res.status(200).json({ "rdata": 1}) ;
    }else{
        // res.status(200).json({ message: '수정을 완료하지 못하였습니다.'}) ;
        res.status(200).json({ "rdata": 0}) ;
    }
  });

export default router;
