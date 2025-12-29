import express from 'express';
import jobModel from '../model/jobModel.js';

const router = express.Router();


/**
 * 전문 관리 라우트
 */
// 전문 목록 조회
router.get('/message/list', async (req, res) => {
    try {
        const result = await jobModel.getMessageList(req.query);
        res.json(result);
    } catch (error) {
        console.error('Error fetching message list:', error);
        res.status(500).json({ message: 'Error fetching message list', error: error.message });
    }
});

// 전문 저장 (추가/수정)
router.post('/message/save', async (req, res) => {
    try {
        const result = await jobModel.saveMessage(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({ message: 'Error saving message', error: error.message });
    }
});



/**
 * 필드(항목) 관리 라우트
 */
// 필드 목록 조회
router.get('/field/list', async (req, res) => {
    try {
        const result = await jobModel.getFieldList(req.query);
        res.json(result);
    } catch (error) {
        console.error('Error fetching field list:', error);
        res.status(500).json({ message: 'Error fetching field list', error: error.message });
    }
});

// 필드 저장 (추가/수정)
router.post('/field/save', async (req, res) => {
    try {
        const result = await jobModel.saveField(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error saving field:', error);
        res.status(500).json({ message: 'Error saving field', error: error.message });
    }
});

// 필드 삭제
router.post('/field/delete', async (req, res) => {
    try {
        const result = await jobModel.deleteField(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error deleting field:', error);
        res.status(500).json({ message: 'Error deleting field', error: error.message });
    }
});

/**
 * 데이터(인스턴스) 관리 라우트
 */
// 데이터 목록 조회
router.get('/data/list', async (req, res) => {
    try {
        const result = await jobModel.getDataList(req.query);
        res.json(result);
    } catch (error) {
        console.error('Error fetching data list:', error);
        res.status(500).json({ message: 'Error fetching data list', error: error.message });
    }
});

// 데이터 저장 (추가/수정)
router.post('/data/save', async (req, res) => {
    try {
        const result = await jobModel.saveData(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).json({ message: 'Error saving data', error: error.message });
    }
});

// 데이터 삭제
router.post('/data/delete', async (req, res) => {
    try {
        const result = await jobModel.deleteData(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error deleting data:', error);
        res.status(500).json({ message: 'Error deleting data', error: error.message });
    }
});


export default router;
