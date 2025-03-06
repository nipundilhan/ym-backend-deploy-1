const { ObjectId } = require('mongodb');
const connectDB = require('../config/db');

async function addCompany(companyData) {
    const db = await connectDB();
    const collection = db.collection('company');

    const company = {
        _id: new ObjectId(),
        name: companyData.name,
        code: companyData.code,
        email: companyData.email,
        package: companyData.package
    };

    const result = await collection.insertOne(company);
    return result;
}

async function findCompanyByCode(code) {
    const db = await connectDB();
    const collection = db.collection('company');

    const company = await collection.findOne({ code });

    return company;
}

module.exports = { addCompany, findCompanyByCode };
