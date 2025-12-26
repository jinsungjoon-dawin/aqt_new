import mondb from '../db/dbconn.js';

const commonModel = {
    /**
     * 프로젝트 목록 조회
     */
    getProjectList: async () => {
        let conn;
        try {
            conn = await mondb.getConnection();
            const rows = await conn.query(`SELECT  PRJ_ID
                                                  ,PRJ_NM
                                                  ,ENC_VAL
                                                  ,FAIL_COND
                                                  ,VIRT_COL1
                                                  ,VIRT_COL2
                                                  ,TCODE
                                                  ,PROTO_TYPE
                                                  ,COMPR_YN
                                                  FROM aqt_project_tb`);
            // Map database columns to expected object structure
            return rows;
        } catch (err) {
            console.error("Error in getProjectList:", err);
            throw err;
        } finally {
            if (conn) conn.release();
        }
    },

    /**
     * 업무 목록 조회
     * @param {Object} req - Express request object
     */
    getJobList: async (req) => {
        let conn;
        try {
            conn = await mondb.getConnection();

            let query = `SELECT PKEY, APP_ID, PRJ_ID, APPNM, MAIN_MGR, GUBUN, SCNT, HOST_IP, HOST_PORT, SVC_URI, SVC_KR_NM, SVC_EN_NM, SVC_KIND, CUMCNT, CRT_ID, CRT_DT, UDT_ID, UDT_DT
                         FROM aqt_business_tb
                         WHERE 1=1`;

            const params = [];

            // req.query에서 prj_id 확인 (GET 요청이므로 query)
            if (req.query && req.query.prj_id) {
                query += ` AND PRJ_ID = ?`;
                params.push(req.query.prj_id);
            }

            const rows = await conn.query(query, params);

            return rows;
        } catch (err) {
            console.error("Error in getJobList:", err);
            throw err;
        } finally {
            if (conn) conn.release();
        }
    },



};

export default commonModel;
