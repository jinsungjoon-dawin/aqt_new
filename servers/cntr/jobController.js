import express from 'express';
import jobModel from '../model/jobModel.js';

const router = express.Router();


/**
 * Message Management Routes
 */
router.get('/message/list', async (req, res) => {
    try {
        const result = await jobModel.getMessageList(req.query);
        res.json(result);
    } catch (error) {
        console.error('Error fetching message list:', error);
        res.status(500).json({ message: 'Error fetching message list', error: error.message });
    }
});


router.post('/message/save', async (req, res) => {
    try {
        const result = await jobModel.saveMessage(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error saving message:', error);
        res.status(500).json({ message: 'Error saving message', error: error.message });
    }
});

router.post('/message/delete', async (req, res) => {
    try {
        const result = await jobModel.deleteMessage(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ message: 'Error deleting message', error: error.message });
    }
});

/**
 * Field Management Routes
 */
router.get('/field/list', async (req, res) => {
    try {
        const result = await jobModel.getFieldList(req.query);
        res.json(result);
    } catch (error) {
        console.error('Error fetching field list:', error);
        res.status(500).json({ message: 'Error fetching field list', error: error.message });
    }
});

router.post('/field/save', async (req, res) => {
    try {
        const result = await jobModel.saveField(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error saving field:', error);
        res.status(500).json({ message: 'Error saving field', error: error.message });
    }
});

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
 * Data Management Routes
 */
router.get('/data/list', async (req, res) => {
    try {
        const result = await jobModel.getDataList(req.query);
        res.json(result);
    } catch (error) {
        console.error('Error fetching data list:', error);
        res.status(500).json({ message: 'Error fetching data list', error: error.message });
    }
});

router.post('/data/save', async (req, res) => {
    try {
        const result = await jobModel.saveData(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).json({ message: 'Error saving data', error: error.message });
    }
});

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
