// inquiry-controller.js
const express = require('express');
const { addInquiry,   getAllInquiries, findByEmail, findByCompanyAndStatus , findByInquiryId , deleteInquiryById , addInquiryComment , changeInquiryStatus , addInquiryMessage , getFirst10Inquiries  } = require('../services/inquiry-service');
const router = express.Router();
const multer = require('multer');

// Set up Multer for file uploads
const upload = multer({ 
    limits: { fileSize: 10 * 1024 * 1024 } // Limit file size to 10MB
});

// Define the route for adding an inquiry
router.post('/', upload.array('attachments'), async (req, res) => {
    try {
        const inquiryData = {
            title: req.body.title,
            companyCode: req.body.companyCode,
            description: req.body.description,
            customerName: req.body.customerName,
            email: req.body.email,
            contactNo: req.body.contactNo,
            attachments: req.files // Multer attaches the files to req.files
        };

        // Call the service to add the inquiry
        await addInquiry(inquiryData);
        res.status(201).json({ message: 'Inquiry added successfully.' });
    } catch (error) {
        console.error('Error adding inquiry:', error);
        res.status(400).json({ message: error.message });
    }
});



// Route to get all inquiries
router.get('/', async (req, res) => {
    try {
        const inquiries = await getAllInquiries();
        res.status(200).json(inquiries);
    } catch (error) {
        console.error('Error fetching inquiries:', error);
        res.status(400).json({ message: error.message });
    }
});

// Route to find inquiries by email
router.get('/findByEmail/:email', async (req, res) => {
    const email = req.params.email;
    try {
        const inquiries = await findByEmail(email);
        res.status(200).json(inquiries);
    } catch (error) {
        console.error('Error fetching inquiries by email:', error);
        res.status(400).json({ message: error.message });
    }
});

// Route to find inquiries by company code and status
router.get('/findByCompanyAndStatus/:companyCode/:status', async (req, res) => {
    const { companyCode, status } = req.params;
    try {
        const inquiries = await findByCompanyAndStatus(companyCode, status);
        res.status(200).json(inquiries);
    } catch (error) {
        console.error('Error fetching inquiries by company code and status:', error);
        res.status(400).json({ message: error.message });
    }
});

router.get('/findByInquiryId/:id', async (req, res) => {
    const inquiryId = req.params.id;
    try {
        const inquiry = await findByInquiryId(inquiryId);
        if (inquiry) {
            res.status(200).json(inquiry);
        } else {
            res.status(404).json({ message: 'Inquiry not found' });
        }
    } catch (error) {
        console.error('Error fetching inquiry by ID:', error);
        res.status(400).json({ message: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    const inquiryId = req.params.id;
    try {
        const result = await deleteInquiryById(inquiryId); // Call the service function
        res.status(200).json(result); // Return success message
    } catch (error) {
        console.error('Error deleting inquiry:', error);
        res.status(400).json({ message: error.message });
    }
});


router.post('/changeStatus', async (req, res) => {
    const { inquiryId, status } = req.body;

    if (!inquiryId || !status) {
        return res.status(400).json({ message: 'inquiryId and status are required.' });
    }

    try {
        const result = await changeInquiryStatus(inquiryId, status);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error updating inquiry status:', error);
        res.status(400).json({ message: error.message });
    }
});


router.post('/addComment', async (req, res) => {
    const { inquiryId, comment } = req.body;

    if (!inquiryId || !comment) {
        return res.status(400).json({ message: 'inquiryId and comment are required.' });
    }

    try {
        const result = await addInquiryComment(inquiryId, comment);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error adding comment to inquiry:', error);
        res.status(400).json({ message: error.message });
    }
});


router.post('/addMessage', async (req, res) => {
    const { inquiryId, message } = req.body;

    // Validate input
    if (!inquiryId || !message) {
        return res.status(400).json({ message: 'inquiryId and message are required.' });
    }

    try {
        const result = await addInquiryMessage(inquiryId, message);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error adding message to inquiry:', error);
        res.status(400).json({ message: error.message });
    }
});

// Route to get the first 10 inquiries with real attachments
router.get('/getProducts', async (req, res) => {
    try {
        const inquiries = await getFirst10Inquiries(); // Call the service to get first 10 inquiries
        res.status(200).json(inquiries); // Send the inquiries with attachments
    } catch (error) {
        console.error('Error fetching first 10 inquiries:', error);
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;