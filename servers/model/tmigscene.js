import mondb from '../db/dbconn.js';

const tmigscene = {
    /**
     * 이행 우측 이행 전광판
     * PieChart
     */
    ttransbolist : async (args) => {
      //console.log("args.query.mid : " + args.query.mid);      

      let rows = await mondb.query(` with timg_tot as 
                                        (select x.mid		as mid
                                            , x.wstat 		as wstat
                                            , x.cnt 		as cnt
                                            , y.scenario 	as scenario
                                        from (select a.mid			                    as mid
                                                   , nvl(a.wstat,0) 	                as wstat
                                                   , count(nvl(a.ActStdt,'1900-01-01'))	as cnt
                                                from tmigscene a
                                                where a.mid = ?
                                                group by a.mid, nvl(a.wstat,0)
                                            ) x
                                        join tmigcode y
                                            on x.mid = y.mid)
                                    , timg as 
                                        (select x.mid		as mid
                                            , x.scgrp 		as scgrp
                                            , x.wstat 		as wstat
                                            , x.cnt 		as cnt
                                            , y.scenario 	as scenario
                                        from (select a.mid			                    as mid
                                                , a.scgrp			                    as scgrp
                                                , nvl(a.wstat,0) 	                    as wstat
                                                , count(nvl(a.ActStdt,'1900-01-01'))	as cnt
                                                from tmigscene a
                                                where a.mid = ?
                                                group by a.mid, a.scgrp, nvl(a.wstat,0)
                                            ) x
                                        join tmigcode y
                                            on x.mid = y.mid
                                        order by x.mid, x.scgrp, x.wstat)
                                    select mid																				                as mid		-- 이행코드
                                        , '0.전체'																			                as scgrp      -- 시나리오그룹
                                        , sum(xx.cnt1) 																		                as plancnt	-- 미수행
                                        , sum(xx.cnt2) 																		                as ingcnt		-- 수행중
                                        , sum(xx.cnt3) 																		                as comcnt		-- 완료
                                        , sum(xx.cnt4) 																		                as errcnt		-- 지연
                                        , sum(xx.cnt1)+sum(xx.cnt2)+sum(xx.cnt3)+sum(xx.cnt4) 								                as totcnt		-- Task
                                        , case when sum(xx.cnt1)+sum(xx.cnt2)+sum(xx.cnt3)+sum(xx.cnt4) = 0 then 0
    	                                        else round(sum(xx.cnt3)/((sum(xx.cnt1)+sum(xx.cnt2)+sum(xx.cnt3)+sum(xx.cnt4)))*100,2) end	as totrate	-- 비율(수행시나리오건수/총시나리오건수)
                                    from (
                                            select aa.mid
                                                , case aa.wstat when 0 then aa.wstat else '' end 		as wstat1
                                                , case aa.wstat when 0 then aa.cnt else 0 end 		    as cnt1
                                                , case aa.wstat when 0 then aa.scenario else 0 end 	    as scenario1
                                                , case aa.wstat when 1 then aa.wstat else '' end 		as wstat2
                                                , case aa.wstat when 1 then aa.cnt else 0 end 		    as cnt2
                                                , case aa.wstat when 1 then aa.scenario else 0 end 	    as scenario2
                                                , case aa.wstat when 2 then aa.wstat else '' end 		as wstat3
                                                , case aa.wstat when 2 then aa.cnt else 0 end 		    as cnt3
                                                , case aa.wstat when 2 then aa.scenario else 0 end 	    as scenario3
                                                , case aa.wstat when 3 then aa.wstat else '' end 		as wstat4
                                                , case aa.wstat when 3 then aa.cnt else 0 end 		    as cnt4
                                                , case aa.wstat when 3 then aa.scenario else 0 end 	    as scenario4
                                            from timg_tot aa
                                            ) xx
                                    group by xx.mid 
                                    union all
                                    select xx.mid																			                as mid		-- 이행코드
                                        , xx.scgrp																			                as scgrp    -- 시나리오그룹
                                        , sum(xx.cnt1) 																	                    as plancnt	-- 미수행
                                        , sum(xx.cnt2) 																	                    as ingcnt	-- 수행중
                                        , sum(xx.cnt3) 																	                    as comcnt	-- 완료
                                        , sum(xx.cnt4) 																	                    as errcnt	-- 지연
                                        , sum(xx.cnt1)+sum(xx.cnt2)+sum(xx.cnt3)+sum(xx.cnt4) 								                as totcnt	-- Task
                                        , case when sum(xx.cnt1)+sum(xx.cnt2)+sum(xx.cnt3)+sum(xx.cnt4) = 0 then 0
    	                                       else round(sum(xx.cnt3)/((sum(xx.cnt1)+sum(xx.cnt2)+sum(xx.cnt3)+sum(xx.cnt4)))*100,2) end	as totrate	-- 비율(수행시나리오건수/총시나리오건수)
                                    from (
                                            select aa.mid												as mid
                                                , aa.scgrp 											    as scgrp
                                                , case aa.wstat when 0 then aa.wstat else '' end 		as wstat1
                                                , case aa.wstat when 0 then aa.cnt else 0 end 			as cnt1
                                                , case aa.wstat when 0 then aa.scenario else 0 end 	    as scenario1
                                                , case aa.wstat when 1 then aa.wstat else '' end 		as wstat2
                                                , case aa.wstat when 1 then aa.cnt else 0 end 			as cnt2
                                                , case aa.wstat when 1 then aa.scenario else 0 end 	    as scenario2
                                                , case aa.wstat when 2 then aa.wstat else '' end 		as wstat3
                                                , case aa.wstat when 2 then aa.cnt else 0 end 			as cnt3
                                                , case aa.wstat when 2 then aa.scenario else 0 end 	    as scenario3
                                                , case aa.wstat when 3 then aa.wstat else '' end 		as wstat4
                                                , case aa.wstat when 3 then aa.cnt else 0 end 			as cnt4
                                                , case aa.wstat when 3 then aa.scenario else 0 end 	    as scenario4
                                            from timg aa
                                            ) xx
                                    group by xx.mid, xx.scgrp	                    
                                    `, [args.query.mid,args.query.mid] ) ;
        return(rows) ;
      },    
    /**
     * 이행 우측 세부 이행 시나리오
     * 테이블 List   
     */
    ttranssclist : async (args) => {
      // console.log("args.query.mid : " + args.query.mid);      
      // console.log("args.query.wstat : " + args.query.wstat);      

      let rows = await mondb.query(`   select ''			                        as flag         -- flag
                                     	    , '' 		                            as checked      -- checkbox
                                            , x.mid								    as mid          -- 이행코드
                                            , y.desc							    as tmignm       -- 이행설명
                                            , y.startDt							    as startdt      -- 이행시작일
                                            , y.endDt							    as endDt        -- 이행종료일
                                            , y.scenario 						    as scenario     -- 시나리오건수
                                            , y.mgb								    as mgb          -- 이행구분(1:리허설,2:본이행)
                                            , case y.mgb when 1 then '리허설' 
                                                        when 2 then '본이행' 
                                                        else '기타' end 			as mgbnm		-- 이행구분명
                                            , z.mclass							    as mclass       -- 시나리오그룹종류(1:사전준비,2:사전이행,3:본이행)
                                            , case z.mclass when 1 then '사전준비' 
                                                            when 2 then '사전이행' 
                                                            when 3 then '본이행' 
                                                            when 4 then '사후' 
                                                            else '기타' end 		as mclassnm     -- 시나리오그룹명
                                            , z.show                    			as disyn		-- display여부
                                            , x.scgrp							    as scgrp        -- 시나리오그룹
                                            , x.pkey							    as pkey         -- pkey
                                            , x.scno							    as scno         -- 시나리오코드
                                            , x.midnm							    as midnm        -- 작업설명
                                            , x.worknm							    as worknm       -- 세부작업내용
                                            , x.planStdt						    as planstdt     -- 계획(시작일시)
                                            , x.planEndt						    as planendt     -- 계획(종료일시)
                                            , x.ActStdt							    as actstdt      -- 시작일시
                                            , x.ActEndt							    as actendt      -- 종료일시
                                            , x.esttime							    as esttime      -- 예상소요시간
                                            , x.acttime							    as acttime      -- 실소요시간
                                            , x.wstat							    as wstat        -- 상태(0:계획,1:진행중,2:작업완료,3:작업오류,99:전체)
                                            , case x.wstat when 0 then '미수행'
                                                            when 1 then '진행중'
                                                            when 2 then '완료'
                                                            when 3 then '지연'
                                                            else '기타' end 		as wstatnm      -- 상태명
                                            , x.pscno								as pscno		-- 병행ID
                                            , x.cscno								as cscno		-- 선행ID
                                            , x.siusr								as siusr		-- SI등록자
                                            , x.smusr								as smusr		-- SM등록자
                                            , x.pserver							    as pserver		-- 수행서버
                                        from ( select a.pkey		    as pkey
                                                    , a.mid			    as mid
                                                    , a.scno		    as scno
                                                    , a.scgrp		    as scgrp
                                                    , a.desc		    as midnm
                                                    , a.worknm		    as worknm
                                                    , a.planStdt	    as planStdt
                                                    , a.planEndt	    as planEndt
                                                    , a.ActStdt		    as ActStdt
                                                    , a.ActEndt		    as ActEndt
                                                    , nvl(a.esttime,0)	as esttime
                                                    , nvl(a.acttime,0)	as acttime
                                                    , nvl(a.wstat,0)	as wstat
                                                    , a.pscno		    as pscno
                                                    , a.cscno		    as cscno
                                                    , a.siUsr		    as siusr
                                                    , a.smUsr		    as smusr
                                                    , a.pserver		    as pserver
                                                from tmigscene a
                                                where a.mid = ?
                                                and nvl(a.wstat,99) between (case ? when 99 then 0 else ? end) and (case ? when 99 then 99 else ? end)
                                            ) x
                                        join tmigcode y
                                            on x.mid = y.mid
                                        join tmigsgrp z
                                            on x.scgrp = z.scgrp
                                        where z.show = 0
                                        order by x.mid, x.scgrp, x.wstat	
                                    `, [args.query.mid, args.query.wstat, args.query.wstat, args.query.wstat, args.query.wstat] ) ;
        return(rows) ;
      },   
    /**
     * 이행 우측 세부 이행 시나리오 update
     * 
     */
    ttransscsave : async (args) => {
        var contact  = JSON.parse(args);

        let msg = { message: 'post :' };
        let qstr = '';
        let qstr2 = '';
        let r = 1;
        let r2 = 1;

        try {
            let mid;
            let pkey;
            let actstst;
            let actendt;
            let wstat;

            for (var i = 0; i < contact.length; i++) { 	
                // console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");
                // console.log(contact[i]); 		
                // console.log(contact[k].mid); 		
                // console.log(contact[k].pkey); 		
                // console.log(contact[k].actstst); 		
                // console.log(contact[k].actendt); 		
                // console.log(contact[k].wstat); 		
                    
                mid = contact[i].mid;
                pkey = contact[i].pkey;
                actstst = contact[i].actstst;
                actendt = contact[i].actendt;
                wstat = contact[i].wstat;
                // console.log('mid : ' + mid); 		
                // console.log('pkey : ' + pkey); 		
                // console.log('actstst : ' + actstst); 		
                // console.log('actendt : ' + actendt); 		
                // console.log('actendt : ' + wstat); 		

                if (actstst === '') {
                    actstst = '1900-01-01';
                }

                if (actendt === '') {
                    actendt = '1900-01-01';
                }

                qstr = `update tmigscene 
                        set ActStdt=?
                          , ActEndt=?
                        where pkey = ? 
                        and mid = ?
                    ` ;

                r = mondb.query(qstr, [actstst, actendt, pkey, mid]);

                qstr2 = `update tmigscene 
                        set wstat = case when ActStdt = '1900-01-01' and ActEndt = '1900-01-01' then 0
                                         when ActStdt <> '1900-01-01' and ActEndt = '1900-01-01' then 1
                                         when ActStdt <> '1900-01-01' and ActEndt <> '1900-01-01' and datediff(planEndt, ActEndt) <= 0 then 2
                                         when ActStdt <> '1900-01-01' and ActEndt <> '1900-01-01' and datediff(planEndt, ActEndt) > 0 then 3
                                         else 2 end
                          , acttime = case when ActStdt = '1900-01-01' and ActEndt = '1900-01-01' then 0
                                           when ActStdt = '1900-01-01' and ActEndt <> '1900-01-01' then 0
                                           when ActStdt <> '1900-01-01' and ActEndt = '1900-01-01' then 0
                                           when ActStdt <> '1900-01-01' and ActEndt <> '1900-01-01' then timestampdiff(hour, date_format(ActStdt, '%Y-%m-%d %H:%i:%s'), date_format(ActEndt, '%Y-%m-%d %H:%i:%s')) end
                        where pkey = ? 
                        and mid = ?
                    ` ;

                r2 = mondb.query(qstr2, [pkey, mid]);

            } 
        } catch (e) {
            console.log(e.message);
            return(0) ;
        } 

        return(1) ;

    },        
}
 
export default tmigscene ;