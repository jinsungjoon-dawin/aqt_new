import mondb from '../db/dbconn.js';




let fields = [];
// Example Field Structure:
// { projectId, jobGroupId, messageId, fieldId, fieldNameEng, fieldNameKor, ... }

let jobDataInstances = [];
// Example Data Instance Structure:
// { projectId, jobGroupId, messageId, rowId (UUID), dynamicData: { ... }, status: 'R' }


const jobs = {



    /**
     * 전문 목록 조회
     * @param {Object} req - 요청 파라미터 (prj_id, app_id 등)
     */
    getMessageList: async (req) => {
        let conn;
        try {
            conn = await mondb.getConnection();

            let query = `select a.PKEY, a.MSG_ID, a.PRJ_ID, a.APP_ID,b.APPNM, a.MSG_KR_NM, a.MSG_EN_NM, a.MSG_TYPE, FORMAT_GB, DIREC_GB, TOT_LEN, COMMENT 
                            from aqt_message_tb a
                            join aqt_business_tb b on b.prj_id = a.prj_id and b.app_id = a.app_id  
                         WHERE 1=1`;

            const params = [];

            if (req) {
                if (req.prj_id) {
                    query += ` AND a.PRJ_ID = ?`;
                    params.push(req.prj_id);
                }
                // Frontend sends app_id, which maps to APP_ID in the table
                const appId = req.app_id || req.app_id;
                if (appId) {
                    query += ` AND a.APP_ID = ?`;
                    params.push(appId);
                }
            }

            const rows = await conn.query(query, params);

            return rows;
        } catch (err) {
            console.error("Error in getMessageList:", err);
            throw err;
        } finally {
            if (conn) conn.release();
        }
    },

    /**
     * 전문 저장 (추가 및 수정)
     * @param {Array|Object} param - 저장할 전문 정보 리스트 또는 객체
     */
    saveMessage: async (param) => {
        const inputList = Array.isArray(param) ? param : [param];
        let savedCount = 0;
        let conn;

        try {
            conn = await mondb.getConnection();
            await conn.beginTransaction();

            for (const item of inputList) {
                // MSG_ID 채번 (없거나 New인 경우)
                // MSG_ID 채번 (없거나 New인 경우)
                if (!item.MSG_ID || item.status === 'N') {
                    const rows = await conn.query(
                        `SELECT 
                            LPAD(
                                IFNULL(
                                    MAX(CAST(SUBSTRING(MSG_ID, 4) AS UNSIGNED)), 
                                    0
                                ) + 1, 
                                11, 
                                '0'
                            ) AS NEXT_SEQ 
                         FROM aqt_message_tb 
                         WHERE PRJ_ID = ? AND APP_ID = ? `,
                        [item.PRJ_ID, item.APP_ID]
                    );
                    item.MSG_ID = 'MSG' + rows[0].NEXT_SEQ;
                }
                // MERGE Query (INSERT ... ON DUPLICATE KEY UPDATE)
                // PKEY가 있으면 Update (Duplicate Key), 없으면 Insert (Auto Increment)
                const query = `
                    INSERT INTO aqt_message_tb (
                        PKEY, MSG_ID, PRJ_ID, APP_ID, MSG_KR_NM, MSG_EN_NM, 
                        MSG_TYPE, FORMAT_GB, DIREC_GB, TOT_LEN, COMMENT
                    ) VALUES (
                        ?, ?, ?, ?, ?, ?, 
                        ?, ?, ?, ?, ?
                    ) ON DUPLICATE KEY UPDATE
                        MSG_ID = VALUES(MSG_ID),
                        PRJ_ID = VALUES(PRJ_ID),
                        APP_ID = VALUES(APP_ID),
                        MSG_KR_NM = VALUES(MSG_KR_NM),
                        MSG_EN_NM = VALUES(MSG_EN_NM),
                        MSG_TYPE = VALUES(MSG_TYPE),
                        FORMAT_GB = VALUES(FORMAT_GB),
                        DIREC_GB = VALUES(DIREC_GB),
                        TOT_LEN = VALUES(TOT_LEN),
                        COMMENT = VALUES(COMMENT)
                `;

                const params = [
                    item.PKEY || null, // PKEY: 없으면 null (Auto Increment)
                    item.MSG_ID,
                    item.PRJ_ID,
                    item.APP_ID,
                    item.MSG_KR_NM,
                    item.MSG_EN_NM,
                    item.MSG_TYPE,
                    item.FORMAT_GB,
                    item.DIREC_GB,
                    item.TOT_LEN || 0,
                    item.COMMENT
                ];

                await conn.query(query, params);
                savedCount++;
            }

            await conn.commit();
            return { count: savedCount, message: "Messages saved successfully" };

        } catch (err) {
            if (conn) await conn.rollback();
            console.error("Error in saveMessage:", err);
            throw err;
        } finally {
            if (conn) conn.release();
        }
    },



    /**
     * 필드 목록 조회
     * @param {Object} req - 요청 파라미터
     */
    getFieldList: async (req) => {
        let conn;
        try {
            conn = await mondb.getConnection();

            let query = `SELECT 
                a.PKEY, a.MSGFLD_ID, a.PRJ_ID, a.APP_ID,b.APPNM, a.MSG_ID, 
                a.FLD_KR_NM, a.FLD_EN_NM, a.FLD_TYPE, a.FLD_LEN, a.FLD_CMT, 
                a.FLD_SGMT, a.ST_POS, a.FLD_DEPTH, a.REPET_NUM, a.FLD_ORDER, 
                a.ESSEN_YN, a.DEFAULT_VAL, a.FLD_FORMAT, a.FLD_CDSET, a.MASK_YN, a.META_CONV_RULE
            FROM aqt_messagefield_tb a
            join aqt_business_tb b on b.prj_id = a.prj_id and b.app_id = a.app_id
            WHERE 1=1`;

            const params = [];

            if (req) {
                if (req.prj_id) {
                    query += ` AND A.PRJ_ID = ?`;
                    params.push(req.prj_id);
                }
                if (req.app_id) {
                    query += ` AND A.APP_ID = ?`;
                    params.push(req.app_id);
                }
                if (req.msg_id) {
                    query += ` AND A.MSG_ID = ?`;
                    params.push(req.msg_id);
                }

                // Field Search Keyword
                if (req.search_keyword) {
                    query += ` AND (FLD_KR_NM LIKE ? OR FLD_EN_NM LIKE ?)`;
                    const keyword = `%${req.search_keyword}%`;
                    params.push(keyword, keyword);
                }
            }
            // 순서 정렬
            query += ` ORDER BY PKEY ASC`;
            console.log(query, params);
            const rows = await conn.query(query, params);
            return rows;

        } catch (err) {
            console.error("Error in getFieldList:", err);
            throw err;
        } finally {
            if (conn) conn.release();
        }
    },

    /**
     * 필드 저장 (추가 및 수정)
     * @param {Array|Object} param - 저장할 필드 정보
     */
    saveField: async (param) => {
        const inputList = Array.isArray(param) ? param : [param];
        let savedCount = 0;
        let conn;

        try {
            conn = await mondb.getConnection();
            await conn.beginTransaction();

            for (const item of inputList) {
                // MSGFLD_ID 채번 (없거나 New인 경우) - Format: FLD + 11 digits
                if (!item.MSGFLD_ID || item.status === 'N') {
                    const rows = await conn.query(
                        `SELECT 
                            LPAD(
                                IFNULL(
                                    MAX(CAST(SUBSTRING(MSGFLD_ID, 4) AS UNSIGNED)), 
                                    0
                                ) + 1, 
                                11, 
                                '0'
                            ) AS NEXT_SEQ 
                         FROM aqt_messagefield_tb 
                         WHERE PRJ_ID = ? AND APP_ID = ? AND MSG_ID = ? AND MSGFLD_ID LIKE 'FLD%'`,
                        [item.PRJ_ID, item.APP_ID, item.MSG_ID]
                    );
                    item.MSGFLD_ID = 'FLD' + (rows[0].NEXT_SEQ || '00000000001');
                }

                // MERGE Query
                const query = `
                    INSERT INTO aqt_messagefield_tb (
                        PKEY, MSGFLD_ID, PRJ_ID, APP_ID, MSG_ID, 
                        FLD_KR_NM, FLD_EN_NM, FLD_TYPE, FLD_LEN, FLD_CMT, 
                        FLD_SGMT, ST_POS, FLD_DEPTH, REPET_NUM, FLD_ORDER, 
                        ESSEN_YN, DEFAULT_VAL, FLD_FORMAT, FLD_CDSET, MASK_YN, META_CONV_RULE
                    ) VALUES (
                        ?, ?, ?, ?, ?, 
                        ?, ?, ?, ?, ?, 
                        ?, ?, ?, ?, ?, 
                        ?, ?, ?, ?, ?, ?
                    ) ON DUPLICATE KEY UPDATE
                        MSGFLD_ID = VALUES(MSGFLD_ID),
                        PRJ_ID = VALUES(PRJ_ID),
                        APP_ID = VALUES(APP_ID),
                        MSG_ID = VALUES(MSG_ID),
                        FLD_KR_NM = VALUES(FLD_KR_NM),
                        FLD_EN_NM = VALUES(FLD_EN_NM),
                        FLD_TYPE = VALUES(FLD_TYPE),
                        FLD_LEN = VALUES(FLD_LEN),
                        FLD_CMT = VALUES(FLD_CMT),
                        FLD_SGMT = VALUES(FLD_SGMT),
                        ST_POS = VALUES(ST_POS),
                        FLD_DEPTH = VALUES(FLD_DEPTH),
                        REPET_NUM = VALUES(REPET_NUM),
                        FLD_ORDER = VALUES(FLD_ORDER),
                        ESSEN_YN = VALUES(ESSEN_YN),
                        DEFAULT_VAL = VALUES(DEFAULT_VAL),
                        FLD_FORMAT = VALUES(FLD_FORMAT),
                        FLD_CDSET = VALUES(FLD_CDSET),
                        MASK_YN = VALUES(MASK_YN),
                        META_CONV_RULE = VALUES(META_CONV_RULE)
                `;

                const params = [
                    item.PKEY || null,
                    item.MSGFLD_ID,
                    item.PRJ_ID,
                    item.APP_ID,
                    item.MSG_ID,
                    item.FLD_KR_NM,
                    item.FLD_EN_NM,
                    item.FLD_TYPE,
                    item.FLD_LEN || 0,
                    item.FLD_CMT,
                    item.FLD_SGMT || 'Root',
                    item.ST_POS || 0,
                    item.FLD_DEPTH || 0,
                    item.REPET_NUM || 1,
                    item.FLD_ORDER || 0,
                    item.ESSEN_YN || 'N',
                    item.DEFAULT_VAL,
                    item.FLD_FORMAT,
                    item.FLD_CDSET,
                    item.MASK_YN || 'N',
                    item.META_CONV_RULE
                ];

                await conn.query(query, params);
                savedCount++;
            }

            await conn.commit();
            return { count: savedCount, message: "Fields saved successfully" };

        } catch (err) {
            if (conn) await conn.rollback();
            console.error("Error in saveField:", err);
            throw err;
        } finally {
            if (conn) conn.release();
        }
    },

    /**
     * 필드 삭제
     * @param {Array|Object} param - 삭제할 필드 정보
     */
    deleteField: async (param) => {
        const inputList = Array.isArray(param) ? param : [param];
        let conn;
        let deletedCount = 0;

        try {
            conn = await mondb.getConnection();
            await conn.beginTransaction();

            for (const item of inputList) {
                // PKEY가 있으면 PKEY로 삭제
                if (item.PKEY) {
                    const query = `DELETE FROM aqt_messagefield_tb WHERE PKEY = ?`;
                    await conn.query(query, [item.PKEY]);
                    deletedCount++;
                }
                // PKEY가 없으면 Unique Key 조합으로 삭제 (PRJ_ID, APP_ID, MSG_ID, MSGFLD_ID)
                else if (item.PRJ_ID && item.APP_ID && item.MSG_ID && item.MSGFLD_ID) {
                    const query = `
                        DELETE FROM aqt_messagefield_tb 
                        WHERE PRJ_ID = ? AND APP_ID = ? AND MSG_ID = ? AND MSGFLD_ID = ?
                    `;
                    await conn.query(query, [item.PRJ_ID, item.APP_ID, item.MSG_ID, item.MSGFLD_ID]);
                    deletedCount++;
                }
            }

            await conn.commit();
            return { count: deletedCount, message: "Fields deleted successfully" };

        } catch (err) {
            if (conn) await conn.rollback();
            console.error("Error in deleteField:", err);
            throw err;
        } finally {
            if (conn) conn.release();
        }
    },

    // --- Data Management (JobData) ---

    /**
     * 전문 데이터 데이터 조회 (JobData)
     * @param {Object} req - 요청 파라미터 (msg_id 등)
     */
    getDataList: async (req) => {
        let conn = null;
        try {
            conn = await mondb.getConnection();
            let params = [];
            let query = `
                SELECT a.PRJ_ID
                      ,d.PRJ_NM
                      ,a.APP_ID 
                      ,c.APPNM 
                      ,a.MSG_ID
                      ,b.MSG_KR_NM 
                      ,a.PKEY
                      ,a.MSGDT_ID
                      ,a.FIXEDLEN_VAL
                      ,a.COMMENT
                FROM aqt_messagedata_tb a 
                join aqt_message_tb b on a.PRJ_ID = b.PRJ_ID  and a.APP_ID = b.APP_ID and a.MSG_ID = b.MSG_ID 
                join aqt_business_tb c on a.PRJ_ID = c.PRJ_ID  and a.APP_ID = c.APP_ID  
                join aqt_project_tb d on a.PRJ_ID = d.PRJ_ID 
            `;
            if (req.prj_id) {
                query += ` AND a.PRJ_ID = ?`;
                params.push(req.prj_id);
            }
            if (req.app_id) {
                query += ` AND a.APP_ID = ?`;
                params.push(req.app_id);
            }
            if (req.msg_id) {
                query += ` AND a.MSG_ID = ?`;
                params.push(req.msg_id);
            }
            const rows = await conn.query(query, params);
            return rows;
        } catch (error) {
            console.error('getDataList error:', error);
            throw error;
        } finally {
            if (conn) conn.release();
        }
    },

    /**
     * 전문 데이터 저장 (추가 및 수정)
     * @param {Array|Object} param - 저장할 데이터 리스트 또는 객체
     */
    saveData: async (param) => {
        const inputList = Array.isArray(param) ? param : [param];
        let savedCount = 0;
        let conn;

        try {
            conn = await mondb.getConnection();
            await conn.beginTransaction();

            for (const item of inputList) {
                // MSGDT_ID Generation (if missing or New) - Format: MDT + 11 digits
                if (!item.MSGDT_ID || item.status === 'N') {
                    const rows = await conn.query(
                        `SELECT 
                            LPAD(
                                IFNULL(
                                    MAX(CAST(SUBSTRING(MSGDT_ID, 4) AS UNSIGNED)), 
                                    0
                                ) + 1, 
                                11, 
                                '0'
                            ) AS NEXT_SEQ 
                         FROM aqt_messagedata_tb 
                         WHERE PRJ_ID = ? AND APP_ID = ? AND MSG_ID = ?`,
                        [item.PRJ_ID || item.projectId, item.APP_ID || item.jobId, item.MSG_ID || item.messageId]
                    );
                    item.MSGDT_ID = 'MDT' + (rows[0].NEXT_SEQ || '00000000001');
                }

                // Default nulls for optional fields to avoid undefined issues
                const prjId = item.PRJ_ID || item.projectId;
                const appId = item.APP_ID || item.jobId; // Frontend sends jobId/APP_ID as selectedJob
                const msgId = item.MSG_ID || item.messageId;
                // If the frontend doesn't send MSGFLD_ID, we default to a placeholder since it's part of the Unique Key
                // unique key: PRJ_ID, APP_ID, MSG_ID, MSGFLD_ID, MSGDT_ID
                // Actually MSGDT_ID is unique enough usually, but let's stick to schema. 
                // We'll assume these are 'row' data not attached to specific field ID, so use a default.
                const msgFldId = item.MSGFLD_ID || 'FLD00000000000';

                const fixedLenVal = item.FIXEDLEN_VAL || item.content || '';
                const comment = item.COMMENT || item.comment || '';

                // MERGE Query
                const query = `
                    INSERT INTO aqt_messagedata_tb (
                        PKEY, MSGDT_ID, PRJ_ID, APP_ID, MSG_ID, 
                        MSGFLD_ID, FIXEDLEN_VAL, COMMENT,
                        CRT_ID, CRT_DT, UDT_ID, UDT_DT
                    ) VALUES (
                        ?, ?, ?, ?, ?, 
                        ?, ?, ?,
                        'monadmin', SYSDATE(), 'monadmin', SYSDATE()
                    ) ON DUPLICATE KEY UPDATE
                        MSGDT_ID = VALUES(MSGDT_ID),
                        PRJ_ID = VALUES(PRJ_ID),
                        APP_ID = VALUES(APP_ID),
                        MSG_ID = VALUES(MSG_ID),
                        MSGFLD_ID = VALUES(MSGFLD_ID),
                        FIXEDLEN_VAL = VALUES(FIXEDLEN_VAL),
                        COMMENT = VALUES(COMMENT),
                        UDT_ID = 'monadmin',
                        UDT_DT = SYSDATE()
                `;

                const params = [
                    item.PKEY || null,
                    item.MSGDT_ID,
                    prjId,
                    appId,
                    msgId,
                    msgFldId,
                    fixedLenVal,
                    comment
                ];

                await conn.query(query, params);
                savedCount++;
            }

            await conn.commit();
            return { count: savedCount, message: "Message Data saved successfully" };

        } catch (err) {
            if (conn) await conn.rollback();
            console.error("Error in saveData:", err);
            throw err;
        } finally {
            if (conn) conn.release();
        }
    },

    /**
     * 전문 데이터 삭제
     * @param {Array|Object} param - 삭제할 데이터 리스트 또는 객체
     */
    deleteData: async (param) => {
        const inputList = Array.isArray(param) ? param : [param];
        let deletedCount = 0;
        let conn;

        try {
            conn = await mondb.getConnection();
            await conn.beginTransaction();

            for (const item of inputList) {
                if (item.PKEY) {
                    await conn.query(`DELETE FROM aqt_messagedata_tb WHERE PKEY = ?`, [item.PKEY]);
                    deletedCount++;
                }
            }

            await conn.commit();
            return { count: deletedCount, message: "Message Data deleted successfully" };

        } catch (err) {
            if (conn) await conn.rollback();
            console.error("Error in deleteData:", err);
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }
};

export default jobs;
