import mondb from '../db/dbconn.js';


let messages = [
    {
        projectId: "1",
        projectName: "프로젝트 A",
        jobGroupId: "GRP001",
        jobName: "업무 1", // For display/search convenience
        jobId: "1",       // Link to job
        messageId: "MSG0001",
        messageNameKr: "테스트 전문 1",
        messageNameEn: "Test Message 1",
        messageType: "요청",
        format: "JSON",
        direction: "IN",
        totalLength: "150",
        description: "테스트를 위한 요청 전문",
        status: "R",
    },
    {
        projectId: "1",
        projectName: "프로젝트 A",
        jobGroupId: "GRP001",
        jobName: "업무 1",
        jobId: "1",
        messageId: "MSG0002",
        messageNameKr: "테스트 전문 2",
        messageNameEn: "Test Message 2",
        messageType: "응답",
        format: "JSON",
        direction: "OUT",
        totalLength: "200",
        description: "테스트를 위한 응답 전문",
        status: "R",
    }
];

let fields = [];
// Example Field Structure:
// { projectId, jobGroupId, messageId, fieldId, fieldNameEng, fieldNameKor, ... }

let jobDataInstances = [];
// Example Data Instance Structure:
// { projectId, jobGroupId, messageId, rowId (UUID), dynamicData: { ... }, status: 'R' }


const jobs = {



    /**
     * 전문 목록 조회
     * @param {Object} req - Request body (for POST) or params
     */
    getMessageList: async (req) => {
        let conn;
        try {
            conn = await mondb.getConnection();

            let query = `select a.PKEY, a.MSG_ID, a.PRJ_ID, a.APP_ID,b.APPNM, a.MSG_KR_NM, a.MSG_EN_NM, a.MSG_TYPE, FORMAT_GB, DIREC_GB, TOT_LEN, COMMENT 
                            from aqt_message_tb a
                            join mondb.aqt_business_tb b on b.prj_id = a.prj_id and b.app_id = a.app_id  
                         WHERE 1=1`;

            const params = [];

            if (req) {
                if (req.prj_id) {
                    query += ` AND a.PRJ_ID = ?`;
                    params.push(req.prj_id);
                }
                // Frontend sends job_id, which maps to APP_ID in the table
                const appId = req.job_id || req.app_id;
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

    deleteMessage: async (param) => {
        // param is list of items to delete
        const inputList = Array.isArray(param) ? param : [param];
        let deletedCount = 0;

        inputList.forEach(inputMsg => {
            const index = messages.findIndex(m => m.messageId === inputMsg.messageId);
            if (index !== -1) {
                messages.splice(index, 1);
                deletedCount++;
                // Also delete associated fields and data? For detailed mock, we might skip cascading for now.
            }
        });
        return { count: deletedCount, message: "Messages deleted successfully" };
    },

    // --- Field Management ---

    getFieldList: async (req) => {
        let conn;
        try {
            conn = await mondb.getConnection();

            let query = `SELECT 
                PKEY, MSGFLD_ID, PRJ_ID, APP_ID, MSG_ID, 
                FLD_KR_NM, FLD_EN_NM, FLD_TYPE, FLD_LEN, FLD_CMT, 
                FLD_SGMT, ST_POS, FLD_DEPTH, REPET_NUM, FLD_ORDER, 
                ESSEN_YN, DEFAULT_VAL, FLD_FORMAT, FLD_CDSET, MASK_YN, META_CONV_RULE
            FROM aqt_messagefield_tb
            WHERE 1=1`;

            const params = [];

            if (req) {
                if (req.prj_id) {
                    query += ` AND PRJ_ID = ?`;
                    params.push(req.prj_id);
                }
                const appId = req.job_id || req.app_id;
                if (appId) {
                    query += ` AND APP_ID = ?`;
                    params.push(appId);
                }
                if (req.message_id) {
                    query += ` AND MSG_ID = ?`;
                    params.push(req.message_id);
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

            const rows = await conn.query(query, params);
            return rows;

        } catch (err) {
            console.error("Error in getFieldList:", err);
            throw err;
        } finally {
            if (conn) conn.release();
        }
    },

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

    getDataList: async (param) => {
        // param: { messageId: "..." }
        if (!param?.messageId) return [];
        const result = jobDataInstances.filter(d => d.messageId === param.messageId);
        return JSON.parse(JSON.stringify(result));
    },

    saveData: async (param) => {
        const inputList = Array.isArray(param) ? param : [param];
        let savedCount = 0;

        inputList.forEach(inputData => {
            if (!inputData.rowId) {
                inputData.rowId = 'ROW' + Math.random().toString(36).substr(2, 9);
            }
            const index = jobDataInstances.findIndex(d => d.rowId === inputData.rowId);

            inputData.status = 'R';
            if (index !== -1) {
                jobDataInstances[index] = inputData;
            } else {
                jobDataInstances.push(inputData);
            }
            savedCount++;
        });
        return { count: savedCount };
    },

    deleteData: async (param) => {
        const inputList = Array.isArray(param) ? param : [param];
        let deletedCount = 0;

        inputList.forEach(inputData => {
            const index = jobDataInstances.findIndex(d => d.rowId === inputData.rowId);
            if (index !== -1) {
                jobDataInstances.splice(index, 1);
                deletedCount++;
            }
        });
        return { count: deletedCount };
    }
};

export default jobs;
