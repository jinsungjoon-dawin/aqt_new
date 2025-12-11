import express from 'express';
import jobs from '../model/jobs.js';

const router = express.Router();

/**
 * GET /list
 * Returns the list of all jobs
 */
router.get('/list', async (req, res) => {
    try {
        const { searchType, keyword } = req.query;
        const result = await jobs.getJobsList(searchType, keyword);
        res.json(result);
    } catch (error) {
        console.error('Error fetching jobs list:', error);
        res.status(500).json({ message: 'Error fetching jobs list', error: error.message });
    }
});

/**
 * GET /details/:id
 * Returns the file details for a specific job
 */
router.get('/details/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await jobs.getJobDetails(id);
        res.json(result);
    } catch (error) {
        console.error('Error fetching job details:', error);
        res.status(500).json({ message: 'Error fetching job details', error: error.message });
    }
});

/**
 * POST /details/batch
 * Returns file details for multiple jobs
 */
router.post('/details/batch', async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
        return res.status(400).json({ message: 'Invalid input: ids must be an array' });
    }
    try {
        const result = await jobs.getJobDetailsBatch(ids);
        res.json(result);
    } catch (error) {
        console.error('Error fetching batch job details:', error);
        res.status(500).json({ message: 'Error fetching batch job details', error: error.message });
    }
});

export default router;
