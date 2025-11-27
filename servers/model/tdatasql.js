import mondb from '../db/dbconn.js' ;

const tdatasql = {
    /**
     * 데이타이관 적제 Data 검증 우측 하단
     * Data 검증 결과
     * 데이터이관ID, 차수, 이관차수명, 작업일, 검증SQL수량, 일치SQL수량, ,불일치SQL수량, 특이사항
     */
    tdatachkresult : async (args) => {
        // console.log("args.query.did : " + args.query.did);      
  
        let rows = await mondb.query(` select a.did		    as did			-- 데이터이관ID
                                            , b.seq		    as seq			-- 차수
                                            , b.dname		as dname		-- 이관차수명
                                            , b.wdate		as wdate		-- 작업일
                                            , a.sqlcnt		as sqlcnt		-- 검증SQL수량
                                            , a.sqlyescnt	as sqlyescnt	-- 일치SQL수량
                                            , a.sqlnocnt	as sqlnocnt		-- 불일치SQL수량
                                            , b.sfdata		as sfdata		-- 특이사항 
                                        from (
                                                select did																as did
                                                    , sum(case sumresult when 'Y' then 1 when 'N' then 1 else 0 end)	as sqlcnt
                                                    , sum(case sumresult when 'Y' then 1 else 0 end)					as sqlyescnt
                                                    , sum(case sumresult when 'N' then 1 else 0 end)					as sqlnocnt
                                                from tdatasql
                                                where did = ?
                                                group by did
                                            ) a
                                        join tdatacode b
                                            on a.did = b.did
                                      `, [args.query.did] ) ;
          return(rows) ;
        },    
    /**
     * 데이타이관 적제 Data 검증 우측 하단 상세내용
     * Data 검증 결과
     * 데이터이관ID, 차수, 이관차수명, 작업일, 검증SQL명, asissum, tobesum, sum비교결과, 특이사항
     */
    tdatachkresultlist : async (args) => {
        // console.log("args.query.did : " + args.query.did);      
  
        let rows = await mondb.query(` select a.did		    as did			-- 데이터이관ID
                                            , b.seq		    as seq			-- 차수
                                            , b.dname		as dname		-- 이관차수명
                                            , b.wdate		as wdate		-- 작업일
                                            , a.sqlno       as sqlno        -- 검증SQLNO
                                            , a.sqlnm		as sqlnm		-- 검증SQL명
                                            , a.sumasis	    as sumasis		-- asissum
                                            , a.sumtobe	    as sumtobe		-- tobesum
                                            , a.sumresult	as sumresult	-- sum비교결과
                                            , b.sfdata		as sfdata		-- 특이사항 
                                        from (
                                                select pkey                                 as sqlno
                                                     , did			                        as did
                                                     , sqlnm			                    as sqlnm
                                                     , sumasis		                        as sumasis
                                                     , sumtobe		                        as sumtobe
                                                     , case sumresult when 'Y' then '일치' 
                                                                      when 'N' then '불일치' 
                                                                      else '미수행' end		as sumresult
                                                from tdatasql
                                                where did = ?
                                                and sumresult = 'N'
                                            ) a
                                        join tdatacode b
                                            on a.did = b.did                   
                                      `, [args.query.did] ) ;
          return(rows) ;
        },    

}
 
export default tdatasql ;