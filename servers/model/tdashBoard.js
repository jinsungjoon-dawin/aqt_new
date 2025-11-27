import mondb from '../db/dbconn.js' ;

const tdashBoard = {
    /**
     * DashBoard 성능테스트 결과(최종) 년월일, 적재 Data 검증 결과(최종) 년월일
     */
    find : async () => {
        let rows = await mondb.query("	select substr(max(X.performdt), 1, 10) as perform_dt                     \
	                                         , trim(substr(max(X.performdt), 11, 500)) as perform_nm             \
	                                         , substr(max(X.dataverifydt), 1, 10) as dataverify_dt               \
	                                         , trim(substr(max(X.dataverifydt), 11, 500)) as dataverify_nm       \
                                        from ( select max(concat(lastDt,tname)) as performdt                    \
			                                        , '' as dataverifydt                                        \
		                                        from tperfcode                                                  \
		                                        where gb='3'                                                    \
		                                        union all                                                       \
		                                        select '' as performdt                                          \
			                                         , max(concat(wdate,dname)) as dataverifydt                 \
		                                        from tdatacode                                                  \
		                                        where wdate in (select max(wdate) from tdatacode)               \
	                                         ) X                                                                \
                                  " ) ;
        return(rows) ;
    },
    /**
     * DashBoard 성능테스트 결과
     */
    performfind : async () => {
        let rows = await mondb.query("	SELECT A.APNM as apnm                               \
                                            , COUNT(DISTINCT S.SID) tcnt                    \
                                            , SUM(IF (SVCTIME < SVCTIME_ASIS,1,0)) scnt     \
                                            FROM tapid A                                    \
                                            JOIN tsid S                                     \
                                                ON (A.APID = S.APID )                       \
                                            JOIN (SELECT TID                                \
                                                    , SID                                   \
                                                    , AVG(SVCTIME) SVCTIME                  \
                                                    , AVG(SVCTIME_ASIS) SVCTIME_ASIS        \
                                                    FROM tperftest                          \
                                                    WHERE TID in (select max(tid) as tid from tperfcode where gb='3')   \
                                                    GROUP BY TID,SID                        \
                                                ) T                                         \
                                                ON (t.sid = s.sid )                         \
                                            JOIN tperfcode p                                \
                                                ON (t.TID = p.TID)                          \
                                            GROUP BY A.APNM                                 \
                                    ") ;
        return(rows) ;
    },
    /**
     * DashBoard 스키마 검증 결과
     */
    datafind : async () => {
        let rows = await mondb.query("	select sum(b.tblAsis) as tblAsis            \
                                    	     , sum(b.tblTobe) as tblTobe            \
	                                         , sum(b.idxAsis) as idxAsis            \
	                                         , sum(b.idxTobe) as idxTobe            \
	                                         , sum(b.objAsis) as objAsis            \
	                                         , sum(b.objTobe) as objTobe            \
	                                         , sum(b.invalidAsis) as invalidAsis    \
	                                         , sum(b.invalidTobe) as invalidTobe    \
                                        from (select did                            \
		                                        from tdatacode                      \
		                                        where wdate in (select max(wdate)   \
                                                                    from tdatacode) \
	                                         ) A                                    \
                                        join tdatatr B                              \
	                                        on a.did = b.did                        \
                                    ") ;
        return(rows) ;
    },
    /**
     * DashBoard Data 검증 결과
     */
    dataverifyfind : async () => {
        let rows = await mondb.query("	select sum(b.tblTobe) as tblTobe                            \
	                                         , sum(b.tblAsis)-sum(b.tblTobe) as tblAsisTobeSum    \
                                        from (select did                                            \
		                                        from tdatacode                                      \
		                                        where wdate in (select max(wdate) from tdatacode)   \
	                                         ) A                                                    \
                                        join tdatatr B                                              \
	                                        on a.did = b.did                                        \
                                    ") ;
        return(rows) ;
    },
    
    /**
     * 임시 파라메터 전달 쿼리
     */
    getPerfSum: async (args) => {
        console.log("args : " + args);

        let rows = await mondb.query("	SELECT A.APNM as apnm                               \
                                            , COUNT(DISTINCT S.SID) tcnt                    \
                                            , SUM(IF (SVCTIME < SVCTIME_ASIS,1,0)) scnt     \
                                            FROM tapid A                                    \
                                            JOIN tsid S                                     \
                                                ON (A.APID = S.APID )                       \
                                            JOIN (SELECT TID                                \
                                                    , SID                                   \
                                                    , AVG(SVCTIME) SVCTIME                  \
                                                    , AVG(SVCTIME_ASIS) SVCTIME_ASIS        \
                                                    FROM tperftest                          \
                                                    WHERE TID = ?                           \
                                                    GROUP BY TID,SID                        \
                                                ) T                                         \
                                                ON (t.sid = s.sid )                         \
                                            JOIN tperfcode p                                \
                                                ON (t.TID = p.TID)                          \
                                            GROUP BY A.APNM                                 \
                                    ", [args] ) ;

        return(rows) ;
    },
    save : async (args) => {
        try {
          let results = await mondb.query("update tprojenv SET 	pjt_name=?,	corpnm=?,	startDt=NOW(),	endDt=NOW(),	intl=?	WHERE PKEY=1 "
            [args.pjtnm, args.corpnm, args.startdt, args.enddt, args.intl] ) ;
          return 1;
        } catch (e) {
          console.error(e) ;
          return 0;
        }
      },
}
 
export default tdashBoard ;
