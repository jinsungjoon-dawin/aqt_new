import mondb from '../db/dbconn.js' ;

const tprojenv = {
  find : async () => {
    let rows = await mondb.query("	SELECT pjt_name, corpnm, startDt, endDt, intl, DATEDIFF(ENDDT, STARTDT) ilsu	FROM tprojenv limit 1" ) ;
    return(rows[0]) ;
  },

  /**
   * 성능테스트 업무별 합
   * @param {*} TID 
   * @returns 
   */
  getPerfSum: async (args) => {
    console.log("args : " + args);
    
    let rows = await mondb.query("	SELECT A.APNM as APNM, COUNT(DISTINCT S.SID) TCNT, SUM(IF (SVCTIME < SVCTIME_ASIS,1,0)) SCNT \
                                    FROM tapid A JOIN tsid S ON (A.APID = S.APID )  JOIN \
                                    (SELECT TID, SID, AVG(SVCTIME) SVCTIME, AVG(SVCTIME_ASIS) SVCTIME_ASIS FROM tperftest  WHERE TID = ? GROUP BY TID,SID) T \
                                    ON (t.sid = s.sid ) JOIN tperfcode p ON (t.TID = p.TID) \
                    GROUP BY A.APNM", [args] ) ;
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
 
export default tprojenv ;
