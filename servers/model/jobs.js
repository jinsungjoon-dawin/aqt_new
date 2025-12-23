import mondb from '../db/dbconn.js';

let jobsData = [
    { id: '1', projectId: '1', name: '업무 1', jobGroupId: 'GRP001' },
    { id: '2', projectId: '1', name: '업무 2', jobGroupId: 'GRP001' },
    { id: '3', projectId: '2', name: '업무 3', jobGroupId: 'GRP002' }
];

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
     * Get list of projects
     */
    getProjectList: async () => {
        let conn;
        try {
            conn = await mondb.getConnection();
            const rows = await conn.query("SELECT PRJ_ID, PRJ_NM FROM aqt_project_tb");
            // Map database columns to expected object structure
            return rows.map(row => ({
                id: row.PRJ_ID.toString(),
                name: row.PRJ_NM
            }));
        } catch (err) {
            console.error("Error in getProjectList:", err);
            throw err;
        } finally {
            if (conn) conn.release();
        }
    },

    /**
     * Get list of jobs
     */
    getJobList: async () => {
        return JSON.parse(JSON.stringify(jobsData));
    },

    // --- Message Management ---

    getMessageList: async (param) => {
        // Filter logic can be added here if needed
        return JSON.parse(JSON.stringify(messages));
    },

    saveMessage: async (param) => {
        // param is an array of messages to save
        const inputList = Array.isArray(param) ? param : [param];
        let savedCount = 0;

        inputList.forEach(inputMsg => {
            const index = messages.findIndex(m => m.messageId === inputMsg.messageId);

            // Only update R/U/N items. D is handled in delete. 
            // Here we assume inputMsg is the *current* state.
            // If status is 'N' (New), add it.
            // If status is 'U' (Update), update it.
            // If status is 'R', just ensure it exists (or ignore).

            if (inputMsg.status === 'N') {
                // Simple ID generation if empty (mocking auto-increment/sequence)
                if (!inputMsg.messageId) {
                    inputMsg.messageId = 'MSG' + Date.now().toString().slice(-4);
                }
                inputMsg.status = 'R'; // Reset status to Read after save
                messages.push(inputMsg);
                savedCount++;
            } else if (inputMsg.status === 'U') {
                if (index !== -1) {
                    inputMsg.status = 'R';
                    messages[index] = inputMsg;
                    savedCount++;
                }
            } else if (index === -1 && inputMsg.messageId) {
                // Determine if we should insert if ID exists but not found? 
                // For safety, treat as insert.
                inputMsg.status = 'R';
                messages.push(inputMsg);
                savedCount++;
            }
        });

        return { count: savedCount, message: "Messages saved successfully" };
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

    getFieldList: async (param) => {
        // param: { messageId: "..." }
        if (!param?.messageId) return [];
        const result = fields.filter(f => f.messageId === param.messageId);
        return JSON.parse(JSON.stringify(result));
    },

    saveField: async (param) => {
        const inputList = Array.isArray(param) ? param : [param];
        let savedCount = 0;

        inputList.forEach(inputField => {
            // Unify logic: Remove 'N'/'U' status and save as 'R'
            // ID Generation
            if (!inputField.fieldId) {
                inputField.fieldId = 'FLD' + Math.random().toString(36).substr(2, 6).toUpperCase();
            }

            // Check existence by unique key (messageId + fieldNameEng) or ID
            const index = fields.findIndex(f => f.messageId === inputField.messageId && f.fieldId === inputField.fieldId);

            if (index !== -1) {
                inputField.status = 'R'; // Confirm saved
                fields[index] = inputField;
            } else {
                inputField.status = 'R';
                fields.push(inputField);
            }
            savedCount++;
        });
        return { count: savedCount };
    },

    deleteField: async (param) => {
        const inputList = Array.isArray(param) ? param : [param];
        let deletedCount = 0;

        inputList.forEach(inputField => {
            // Find and remove
            const index = fields.findIndex(f => f.messageId === inputField.messageId && f.fieldId === inputField.fieldId);
            if (index !== -1) {
                fields.splice(index, 1);
                deletedCount++;
            }
        });
        return { count: deletedCount };
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
