const express = require('express');
const router = express.Router();
const { addCompany , findCompanyByCode  } = require('../services/company-service');

router.post('/add', async (req, res) => {
    try {
        const { name, code, email, package } = req.body;

        if (!name || !code || !email || !package) {
            return res.status(400).json({ message: "All fields are required." });
        }

        const result = await addCompany({ name, code, email, package });

        res.status(201).json({ message: "Company added successfully", companyId: result.insertedId });
    } catch (error) {
        console.error("Error adding company:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.get('/:code', async (req, res) => {
    try {
        const { code } = req.params;

        if (!code) {
            return res.status(400).json({ message: "Company code is required." });
        }

        const company = await findCompanyByCode(code);

        if (!company) {
            return res.status(404).json({ message: "Company not found." });
        }

        res.status(200).json(company);
    } catch (error) {
        console.error("Error finding company:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;