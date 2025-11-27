import mondb from '../db/dbconn.js';
 
const tmigcode = {
    /**
     * 시스템이행 기준정보
     */
    ttranslist : async () => {
      let rows = await mondb.query(` select x.mid 			  as mid
                                          , x.midnm			  as midnm
                                          , x.mgb 			  as mgb
                                          , x.mgbnm			  as mgbnm
                                          , x.startDt 		as startdt
                                          , x.endDt 			as enddt
                                          , x.scenario 		as scenario 
                                        from (
                                            select a.mid 						                as mid
                                              , a.desc							                as midnm
                                              , a.mgb 							                as mgb
                                              , case a.mgb when 1 then '이행리허설'
                                                      when 2 then '본이행'
                                                      else '기타' end 		          as mgbnm
                                              , a.startDt 						              as startdt
                                              , a.endDt 							              as enddt
                                              , a.scenario 						              as scenario 
                                            from tmigcode a
                                          ) x
                                        order by x.mgb desc, x.startDt desc, x.mid
                                  ` ) ;                                               
      return(rows) ;
    },    
}
 
export default tmigcode ;