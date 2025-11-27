import mondb from '../db/dbconn.js' ;

const tdatacode = {
    /**
     * DashBoard 성능테스트 결과(최종) 년월일, 적재 Data 검증 결과(최종) 년월일
     */
    find : async () => {
        let rows = await mondb.query(`	select substr(max(X.performdt), 1, 10)            as performdt
	                                           , trim(substr(max(X.performdt), 11, 500))    as performnm
	                                           , substr(max(X.dataverifydt), 1, 10)         as dataverifydt
	                                           , trim(substr(max(X.dataverifydt), 11, 500)) as dataverifynm
                                        from ( 
                                                select max(concat(lastDt,tname)) as performdt
			                                               , ''                        as dataverifydt
                                                from tperfcode
                                                where gb='3'
                                                union all
                                                select ''                        as performdt
                                                     , max(concat(wdate,dname))  as dataverifydt
                                                from tdatacode
	                                         ) X
                                    ` ) ;
        return(rows) ;
    },
    /**
     *  데이타이관 적제 Data 검증 좌측
     * 차수, 년월일
     */
    tdatalist : async () => {
      let rows = await mondb.query(` select did		as did		-- 데이터이관ID
                                          , seq		as seq		-- 차수
                                          , dname	as dname	-- 이관차수명
                                          , wdate	as wdate	-- 작업일
                                          , sf 		as sf 		-- 특이사항
                                      from tdatacode
                                      order by wdate desc, did desc
                                  ` ) ;                                               
      return(rows) ;
    },    
}
 
export default tdatacode ;