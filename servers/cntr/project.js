import express from 'express';
import projectManagement from '../model/projectManagement.js';

const router = express.Router();

// Get list
router.get('/list', async (req, res) => {
    try {
        const { type, keyword } = req.query; // Project.svelte sends 'type' instead of 'searchType' in fetchProjects
        const result = await projectManagement.getProjectList(type, keyword);
        res.json(result);
    } catch (error) {
        console.error('Error fetching project list:', error);
        res.status(500).json({ message: 'Error fetching project list', error: error.message });
    }
});

// Save (Insert or Update)
router.post('/save', async (req, res) => {
    const projectData = req.body;
    try {
        // Validation could go here
        if (!projectData.prj_nm) {
            return res.status(400).send("Project Name is required");
        }

        const result = await projectManagement.saveProject(projectData);

        if (projectData.prj_id && projectData.prj_id !== '자동생성' && projectData.prj_id !== '') {
            res.json({ message: 'Project updated successfully' });
        } else {
            res.json({ message: 'Project added successfully', id: result.insertId });
        }
    } catch (error) {
        console.error('Error saving project:', error);
        res.status(500).json({ message: 'Error saving project', error: error.message });
    }
});

// Delete
router.delete('/delete/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await projectManagement.deleteProject(id);
        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ message: 'Error deleting project', error: error.message });
    }
});

// --- Business Table Routes ---

// Get Business List
router.get('/business/list', async (req, res) => {
    try {
        const { type, keyword, projectId } = req.query;
        const result = await projectManagement.getBusinessList(type, keyword, projectId);
        res.json(result);
    } catch (error) {
        console.error('Error fetching business list:', error);
        res.status(500).json({ message: 'Error fetching business list', error: error.message });
    }
});

// Save Business Item
router.post('/business/save', async (req, res) => {
    try {
        const data = req.body;
        // Basic validation
        if (!data.prj_id) {
            // Depending on logic, project_id is FK, so it's required.
            // But if user is just adding a row without linking yet? 
            // DB says NOT NULL. So must be provided.
            return res.status(400).send("Project ID is required");
        }
        const result = await projectManagement.saveBusiness(data);
        res.json({ message: 'Saved successfully', result });
    } catch (error) {
        console.error('Error saving business item:', error);
        res.status(500).json({ message: 'Error saving business item', error: error.message });
    }
});

// Delete Business Item
router.delete('/business/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await projectManagement.deleteBusiness(id);
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Error deleting business item:', error);
        res.status(500).json({ message: 'Error deleting business item', error: error.message });
    }
});

// Get Next APP_ID
router.get('/business/next-app-id', async (req, res) => {
    try {
        const nextId = await projectManagement.getNextAppId();
        res.json({ nextId });
    } catch (error) {
        console.error('Error getting next APP_ID:', error);
        res.status(500).json({ message: 'Error getting next APP_ID', error: error.message });
    }
});

export default router;
