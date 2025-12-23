import express from 'express';
import jobs from '../model/jobs.js';

const router = express.Router();

router.get('/job/list', async (req, res) => {
    try {
        const result = await jobs.getJobList();
        res.json(result);
    } catch (error) {
        console.error('Error fetching job list:', error);
        res.status(500).json({ message: 'Error fetching job list', error: error.message });
    }
});

/**
 * Message Management Routes
 */
router.post('/message/list', async (req, res) => {
    try {
        const result = await jobs.getMessageList(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error fetching message list:', error);
        res.status(500).json({ message: 'Error fetching message list', error: error.message });
    }
});

router.post('/message/save', async (req, res) => {
    try {
        const result = await jobs.saveMessage(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({ message: 'Error saving message', error: error.message });
    }
});

router.post('/message/delete', async (req, res) => {
    try {
        const result = await jobs.deleteMessage(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ message: 'Error deleting message', error: error.message });
    }
});

/**
 * Field Management Routes
 */
router.post('/field/list', async (req, res) => {
    try {
        const result = await jobs.getFieldList(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error fetching field list:', error);
        res.status(500).json({ message: 'Error fetching field list', error: error.message });
    }
});

router.post('/field/save', async (req, res) => {
    try {
        const result = await jobs.saveField(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error saving field:', error);
        res.status(500).json({ message: 'Error saving field', error: error.message });
    }
});

router.post('/field/delete', async (req, res) => {
    try {
        const result = await jobs.deleteField(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error deleting field:', error);
        res.status(500).json({ message: 'Error deleting field', error: error.message });
    }
});

/**
 * Data Management Routes
 */
router.post('/data/list', async (req, res) => {
    try {
        const result = await jobs.getDataList(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error fetching data list:', error);
        res.status(500).json({ message: 'Error fetching data list', error: error.message });
    }
});

router.post('/data/save', async (req, res) => {
    try {
        const result = await jobs.saveData(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).json({ message: 'Error saving data', error: error.message });
    }
});

router.post('/data/delete', async (req, res) => {
    try {
        const result = await jobs.deleteData(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error deleting data:', error);
        res.status(500).json({ message: 'Error deleting data', error: error.message });
    }
});


export default router;
