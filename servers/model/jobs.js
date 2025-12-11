import mondb from '../db/dbconn.js';

const jobs = {
    /**
     * Get list of all jobs with table information
     * @param {string} searchType - Type of search ('job_id', 'job_description')
     * @param {string} keyword - Search keyword
     */
    getJobsList: async (searchType, keyword) => {
        let sql = `
            SELECT 
                j.id, 
                j.job_id, 
                j.job_description, 
                j.execution_date, 
                j.command,
                j.table_id
            FROM jobs j
        `;

        let params = [];
        if (keyword) {
            if (searchType === 'job_id') {
                sql += ` WHERE j.job_id LIKE ?`;
                params.push(`%${keyword}%`);
            } else if (searchType === 'job_description') {
                sql += ` WHERE j.job_description LIKE ?`;
                params.push(`%${keyword}%`);
            }
        }

        sql += ` ORDER BY j.execution_date DESC`;

        let rows = await mondb.query(sql, params);
        return rows;
    },

    /**
     * Get file details for a specific job
     * @param {number} id - The job's primary key ID
     */
    getJobDetails: async (id) => {
        // First get the table name associated with this job
        const jobInfo = await mondb.query(`
            SELECT ti.table_name 
            FROM jobs j
            JOIN table_info ti ON j.table_id = ti.id
            WHERE j.id = ?
        `, [id]);

        if (jobInfo.length === 0) {
            throw new Error('Job not found');
        }

        const tableName = jobInfo[0].table_name;

        // Now query the dynamic table for file details
        // Note: Using string interpolation for table name as it's from our DB, but still risky if table_names aren't strictly controlled.
        // Assuming table_info is trusted source.
        const fileDetails = await mondb.query(`
            SELECT * 
            FROM ${tableName} 
            WHERE job_pk_id = ?
        `, [id]);

        return fileDetails;
    },

    /**
     * Get file details for multiple jobs
     * @param {number[]} ids - Array of job primary key IDs
     */
    getJobDetailsBatch: async (ids) => {
        if (!ids || ids.length === 0) return [];

        // 1. Get table names for all requested jobs
        // Use 'IN (?)' where ? is the array, mariadb connector handles it
        const jobInfo = await mondb.query(`
            SELECT j.id, ti.table_name 
            FROM jobs j
            JOIN table_info ti ON j.table_id = ti.id
            WHERE j.id IN (?)
        `, [ids]);

        if (jobInfo.length === 0) return [];

        // 2. Group job IDs by table name
        const idsByTable = {};
        jobInfo.forEach(info => {
            if (!idsByTable[info.table_name]) {
                idsByTable[info.table_name] = [];
            }
            idsByTable[info.table_name].push(info.id);
        });

        // 3. Query each table
        let allFiles = [];
        for (const tableName in idsByTable) {
            const tableIds = idsByTable[tableName];
            // Safe interpolation of tableName (assuming trusted source from DB)
            // Ideally should validate tableName against allowlist or similar
            const files = await mondb.query(`
                SELECT * 
                FROM ${tableName} 
                WHERE job_pk_id IN (?)
                ORDER BY id DESC
            `, [tableIds]);
            allFiles = [...allFiles, ...files];
        }

        return allFiles;
    }
};

export default jobs;
