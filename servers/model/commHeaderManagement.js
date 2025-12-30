import mondb from '../db/dbconn.js';

const commHeaderManagement = {

    getCommHeaderList: async (searchType, keyword, prj_id, app_id) => {
        let sql = `SELECT T1.*, T2.COMMHD_KR_NM, T2.COMMHD_EN_NM, T3.PRJ_NM
                    FROM aqt_commheaderfield_tb T1
                    LEFT JOIN aqt_commheader_tb T2 ON T1.COMMHD_ID = T2.COMMHD_ID AND T1.PRJ_ID = T2.PRJ_ID AND T1.APP_ID = T2.APP_ID
                    LEFT JOIN aqt_project_tb T3 ON T1.PRJ_ID = T3.PRJ_ID
                    WHERE 1=1 `;
        let params = [];

        if (prj_id && prj_id !== '') {
            sql += ` AND T1.PRJ_ID = ? `;
            params.push(prj_id);
        }

        if (app_id && app_id !== '') {
            sql += ` AND T1.APP_ID = ? `;
            params.push(app_id);
        }

        if (keyword) {
            if (searchType === 'FLD_KR_NM') {
                sql += ` AND T1.FLD_KR_NM LIKE ? `;
                params.push(`%${keyword}%`);
            } else if (searchType === 'FLD_EN_NM') {
                sql += ` AND T1.FLD_EN_NM LIKE ? `;
                params.push(`%${keyword}%`);
            } else if (searchType === 'FLD_DESC') {
                sql += ` AND T1.FLD_CMT LIKE ? `;
                params.push(`%${keyword}%`);
            } else if (searchType === 'all') {
                sql += ` AND (T1.FLD_KR_NM LIKE ? OR T1.FLD_EN_NM LIKE ? OR T1.FLD_CMT LIKE ? OR T1.COMMHD_ID LIKE ?) `;
                params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
            }
        }

        sql += ` ORDER BY T1.FLD_ORDER ASC`;

        const rows = await mondb.query(sql, params);
        return rows;
    },

    getCommHeaderDetail: async (prj_id, app_id) => {
        let sql = `SELECT PKEY, COMMHD_ID, PRJ_ID, APP_ID, COMMHD_KR_NM, COMMHD_EN_NM, MSG_TYPE, FORMAT_GB, DIREC_GB, TOT_LEN, COMMENT
                    FROM aqt_commheader_tb
                    WHERE PRJ_ID = ? AND APP_ID = ?
                    ORDER BY PKEY DESC LIMIT 1`;
        const rows = await mondb.query(sql, [prj_id, app_id]);
        return rows[0] || null;
    },

    getNextCommHeaderId: async (prj_id, app_id) => {
        const sql = `SELECT MAX(COMMHD_ID) as maxId FROM aqt_commheader_tb WHERE PRJ_ID = ? AND APP_ID = ?`;
        const rows = await mondb.query(sql, [prj_id, app_id]);
        let nextNum = 1;
        if (rows[0] && rows[0].maxId) {
            const currentMax = rows[0].maxId;
            // Expected format COM00000000001 (13 chars)
            const numericPart = currentMax.replace('COM', '');
            if (!isNaN(numericPart)) {
                nextNum = parseInt(numericPart, 10) + 1;
            }
        }
        return 'COM' + String(nextNum).padStart(10, '0');
    },

    saveCommHeader: async (data) => {
        if (data.pkey) {
            // UPDATE
            const sql = `UPDATE aqt_commheader_tb SET 
                            COMMHD_ID = ?, PRJ_ID = ?, APP_ID = ?, COMMHD_KR_NM = ?, COMMHD_EN_NM = ?, 
                            MSG_TYPE = ?, FORMAT_GB = ?, DIREC_GB = ?, TOT_LEN = ?, COMMENT = ?
                         WHERE PKEY = ?`;
            const params = [
                data.comm_header_id, data.project, data.job, data.comm_header_name_kr, data.comm_header_name_en,
                data.msg_type, data.format, data.direction, data.total_length, data.description,
                data.pkey
            ];
            return await mondb.query(sql, params);
        } else {
            // INSERT
            let commHeaderId = data.comm_header_id;
            if (!commHeaderId) {
                commHeaderId = await commHeaderManagement.getNextCommHeaderId(data.project, data.job);
            }

            const sql = `INSERT INTO aqt_commheader_tb (
                            COMMHD_ID, PRJ_ID, APP_ID, COMMHD_KR_NM, COMMHD_EN_NM, 
                            MSG_TYPE, FORMAT_GB, DIREC_GB, TOT_LEN, COMMENT
                         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            const params = [
                commHeaderId, data.project, data.job, data.comm_header_name_kr, data.comm_header_name_en,
                data.msg_type, data.format, data.direction, data.total_length, data.description
            ];
            return await mondb.query(sql, params);
        }
    },

    getNextCommHeaderFieldId: async (prj_id, app_id, comm_hd_id) => {
        const sql = `SELECT MAX(COMMHDFLD_ID) as maxId FROM aqt_commheaderfield_tb WHERE PRJ_ID = ? AND APP_ID = ? AND COMMHD_ID = ?`;
        const rows = await mondb.query(sql, [prj_id, app_id, comm_hd_id]);
        let nextNum = 1;
        if (rows[0] && rows[0].maxId) {
            const currentMax = rows[0].maxId;
            // Expected format FLD00000000001 (13 chars)
            const numericPart = currentMax.replace("FLD", "");
            if (!isNaN(numericPart)) {
                nextNum = parseInt(numericPart, 10) + 1;
            }
        }
        return "FLD" + String(nextNum).padStart(10, "0");
    },

    saveCommHeaderList: async (list) => {
        for (const item of list) {
            if (item.isNew) {
                // INSERT
                let fieldId = item.COMMHDFLD_ID;
                if (!fieldId) {
                    fieldId = await commHeaderManagement.getNextCommHeaderFieldId(
                        item.PRJ_ID,
                        item.APP_ID,
                        item.COMMHD_ID,
                    );
                }
                const sql = `INSERT INTO aqt_commheaderfield_tb (
                                COMMHDFLD_ID, PRJ_ID, APP_ID, COMMHD_ID, 
                                FLD_KR_NM, FLD_EN_NM, FLD_TYPE, FLD_LEN, FLD_CMT, 
                                FLD_SGMT, ST_POS, FLD_ORDER, ESSEN_YN, DEFAULT_VAL, 
                                FLD_FORMAT, FLD_CDSET, MASK_YN, META_CONV_RULE
                             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                const params = [
                    fieldId,
                    item.PRJ_ID,
                    item.APP_ID,
                    item.COMMHD_ID,
                    item.FLD_KR_NM,
                    item.FLD_EN_NM,
                    item.FLD_TYPE,
                    item.FLD_LEN || 0,
                    item.FLD_CMT,
                    item.FLD_SGMT || "N",
                    item.ST_POS || 0,
                    item.FLD_ORDER || 0,
                    item.ESSEN_YN || "N",
                    item.DEFAULT_VAL,
                    item.FLD_FORMAT,
                    item.FLD_CDSET,
                    item.MASK_YN || "N",
                    item.META_CONV_RULE,
                ];
                await mondb.query(sql, params);
            } else {
                // UPDATE
                const sql = `UPDATE aqt_commheaderfield_tb SET 
                                COMMHDFLD_ID = ?, PRJ_ID = ?, APP_ID = ?, COMMHD_ID = ?, 
                                FLD_KR_NM = ?, FLD_EN_NM = ?, FLD_TYPE = ?, FLD_LEN = ?, FLD_CMT = ?, 
                                FLD_SGMT = ?, ST_POS = ?, FLD_ORDER = ?, ESSEN_YN = ?, DEFAULT_VAL = ?, 
                                FLD_FORMAT = ?, FLD_CDSET = ?, MASK_YN = ?, META_CONV_RULE = ?
                             WHERE PKEY = ?`;
                const params = [
                    item.COMMHDFLD_ID,
                    item.PRJ_ID,
                    item.APP_ID,
                    item.COMMHD_ID,
                    item.FLD_KR_NM,
                    item.FLD_EN_NM,
                    item.FLD_TYPE,
                    item.FLD_LEN || 0,
                    item.FLD_CMT,
                    item.FLD_SGMT || "N",
                    item.ST_POS || 0,
                    item.FLD_ORDER || 0,
                    item.ESSEN_YN || "N",
                    item.DEFAULT_VAL,
                    item.FLD_FORMAT,
                    item.FLD_CDSET,
                    item.MASK_YN || "N",
                    item.META_CONV_RULE,
                    item.PKEY,
                ];
                await mondb.query(sql, params);
            }
        }
        return { success: true };
    },

    deleteCommHeader: async (pkey) => {
        const sql = `DELETE FROM aqt_commheader_tb WHERE PKEY = ?`;
        return await mondb.query(sql, [pkey]);
    }
};

export default commHeaderManagement;