// inquiry-service.js
const connectDB = require('../config/db');
const { ObjectId } = require('mongodb');
const { formatDate } = require('../services/modules-service');
const nodemailer = require('nodemailer');

// Function to add an inquiry
async function addInquiry(inquiryData) {
    const db = await connectDB();
    const inquiriesCollection = db.collection('inquiries');
    const attachmentCollection = db.collection('attachments');

    // Insert attachments into the attachments collection
    const attachmentRefs = [];
    for (const file of inquiryData.attachments) {
        const attachmentDoc = {
            filename: file.originalname,
            contentType: file.mimetype,
            data: file.buffer
        };
        const attachmentResult = await attachmentCollection.insertOne(attachmentDoc);
        attachmentRefs.push(attachmentResult.insertedId);
    }

    const now = new Date();

    // Prepare the inquiry object
    const inquiry = {
        _id: new ObjectId(),
        inquiryNumber : inquiryData.companyCode +"-"+Date.now()+"-"+ getLetterCode() +"-"+getDateCode(),
        title: inquiryData.title,
        companyCode: inquiryData.companyCode,
        description: inquiryData.description,
        date: formatDate(new Date()),
        year : now.getFullYear(),
        month: now.getMonth()+1,
        status: "VERIFICATION_PENDING",
        customerName: inquiryData.customerName,
        category : inquiryData.category,
        priorityLevel: inquiryData.priorityLevel,
        email: inquiryData.email,
        contactNo: inquiryData.contactNo,
        attachments: attachmentRefs, // Store the ObjectIds of attachments
        comments: [],
        messages: []
    };

    // Insert the inquiry into the inquiries collection
    await inquiriesCollection.insertOne(inquiry);
}

function getDateCode() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Get month (01-12)
    const day = String(now.getDate()).padStart(2, '0'); // Get day (01-31)
    return month + day;
}

function getLetterCode() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return result;
}

const skipCount = 0;
async function getAllInquiries() {
    const db = await connectDB();
    const inquiriesCollection = db.collection('inquiries');
    return inquiriesCollection.find().skip(skipCount).sort({ date: -1 }).toArray();

    
}

// Function to find inquiries by email and skip the first 12 results
async function findByEmail(email) {
    const db = await connectDB();
    const inquiriesCollection = db.collection('inquiries');
    const query = { email: email };
    return inquiriesCollection.find(query).skip(0).sort({ date: -1 }).toArray();
}

// Function to find inquiries by company code and status, skipping the first 12 results
async function findByCompanyAndStatus(companyCode, status, category = null) {
    const db = await connectDB();
    const inquiriesCollection = db.collection('inquiries');

    // Build the query dynamically
    const query = { companyCode, status };

    if (category) {
        query.category = category;
    }

    return inquiriesCollection.find(query).skip(0).sort({ date: -1 }).toArray();
}


async function findByInquiryId(inquiryId) {
    const db = await connectDB();
    const inquiriesCollection = db.collection('inquiries');
    const attachmentCollection = db.collection('attachments');

    // Fetch the inquiry by its ID
    const inquiry = await inquiriesCollection.findOne({ _id: new ObjectId(inquiryId) });
    
    if (inquiry) {
        // Fetch the attachments by their ObjectIds
        const attachments = await attachmentCollection.find({
            _id: { $in: inquiry.attachments.map(id => new ObjectId(id)) }
        }).toArray();

        // Add the attachments data to the inquiry object
        inquiry.attachments = attachments;
        return inquiry;
    }

    return null; // Return null if the inquiry was not found
}

async function deleteInquiryById(inquiryId) {
    const db = await connectDB();
    const inquiryCollection = db.collection('inquiries');
    const attachmentCollection = db.collection('attachments');

    // Find the inquiry
    const inquiry = await inquiryCollection.findOne({ _id: new ObjectId(inquiryId) });
    if (!inquiry) {
        throw new Error('Inquiry not found.');
    }

    // Delete attachments if they exist
    if (inquiry.attachments && inquiry.attachments.length > 0) {
        const deleteResult = await attachmentCollection.deleteMany({
            _id: { $in: inquiry.attachments.map(id => new ObjectId(id)) },
        });
        console.log(`${deleteResult.deletedCount} attachments deleted.`);
    }

    // Delete the inquiry itself
    const deleteInquiryResult = await inquiryCollection.deleteOne({ _id: new ObjectId(inquiryId) });
    if (deleteInquiryResult.deletedCount === 0) {
        throw new Error('Failed to delete the inquiry.');
    }

    return { message: 'Inquiry and associated attachments deleted successfully.' };
}


async function addInquiryComment(inquiryId, comment) {
    const db = await connectDB();
    const inquiriesCollection = db.collection('inquiries');

    // Add the comment to the inquiry's comments array
    const updateResult = await inquiriesCollection.updateOne(
        { _id: new ObjectId(inquiryId) },
        { $push: { comments: { comment, date: new Date() } } }
    );

    if (updateResult.matchedCount === 0) {
        throw new Error('Inquiry not found.');
    }

    return { message: 'Comment added to the inquiry successfully.' };
}


async function addInquiryMessage(inquiryId, message) {
    const db = await connectDB();
    const inquiriesCollection = db.collection('inquiries');

    // Update the inquiry to ensure only one message exists
    const updateResult = await inquiriesCollection.updateOne(
        { _id: new ObjectId(inquiryId) },
        { $set: { messages: [{ message, date: new Date() }] } } // Replace the entire `messages` array
    );

    if (updateResult.matchedCount === 0) {
        throw new Error('Inquiry not found.');
    }

    return { message: 'Message added to the inquiry successfully.' };
}

async function getFirst10Inquiries() {
    const db = await connectDB();
    const inquiriesCollection = db.collection('inquiries');
    const attachmentCollection = db.collection('attachments');

    // Fetch the first 10 inquiries
    const inquiries = await inquiriesCollection.find().limit(12).toArray();

    // For each inquiry, fetch and replace the attachment ObjectIds with the real attachment objects
    for (let inquiry of inquiries) {
        if (inquiry.attachments && inquiry.attachments.length > 0) {
            // Fetch the attachments by their ObjectIds
            const attachments = await attachmentCollection.find({
                _id: { $in: inquiry.attachments.map(id => new ObjectId(id)) }
            }).toArray();

            // Replace the attachment ObjectIds with the real attachment objects
            inquiry.attachments = attachments;
        }
    }

    return inquiries;
}

async function changeInquiryStatus(inquiryId, status) {
    const db = await connectDB();
    const inquiriesCollection = db.collection('inquiries');



    // Update the inquiry status
    const updateResult = await inquiriesCollection.updateOne(
        { _id: new ObjectId(inquiryId) },
        { $set: { status } }
    );

    if (updateResult.matchedCount === 0) {
        throw new Error('Inquiry not found.');
    }

    // Fetch the updated inquiry details
    const updatedInquiry = await inquiriesCollection.findOne({ _id: new ObjectId(inquiryId) });
    //console.log('Came to here');
    // Check if the status is "COMPLETED" and send email
    if (status === "VERIFIED") {
        await sendInformingEmail(updatedInquiry); // Pass inquiry details to the email function
        console.log(`Email sent successfully to ${updatedInquiry.email}`);
    }


    if (status === "COMPLETED") {
        try {
            await sendDynamicEmail(updatedInquiry); // Pass inquiry details to the email function
            console.log(`Email sent successfully to ${updatedInquiry.email}`);
        } catch (error) {
            console.error(`Failed to send email: ${error.message}`);
        }
    }

    return { message: 'Inquiry status updated successfully.' };
}

async function sendDynamicEmail(inquiryData) {

    const senderEmail = 'nipun.dilhan1@gmail.com';
    const transporter = nodemailer.createTransport({
        service: 'gmail', // You can use another SMTP service
        auth: {
            user: senderEmail, // Your email address
            pass: 'fdbdrmztwflqghbt' // Your email password or App Password (for Gmail)
        }
    });

    // Prepare the header image URL
    const headerImageUrl = `https://slbis-photos.onrender.com/header.jpg`; // Replace 'yourBaseUrl' with your actual base URL

    // Prepare the email content
    const emailContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;width: 96%;">
            <img src="${headerImageUrl}" alt="Header Image" style="width: 96%; height: 12%;" />
            <p>Dear ${inquiryData.customerName},</p>
            <p>We are happy to inform you that the status of your inquiry has been updated to <strong>${inquiryData.status}</strong>.</p>
            <p><strong>Inquiry Details:</strong></p>
            <p>Title: ${inquiryData.title}</p>
            <p>Company: ${inquiryData.companyCode}</p>
            <p>Date: ${inquiryData.date}</p>
            <p>Status: ${inquiryData.status}</p>
            <p><strong>COMPLETE Message:</strong></p>
            <div>${inquiryData.messages[0].message}</div>
            <p><strong>Comments:</strong></p>
            <table border="1" style="width: 90%; border-collapse: collapse; margin-top: 10px;">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Comment</th>
                        
                    </tr>
                </thead>
                <tbody>
                    ${inquiryData.comments.map(comment => `
                        <tr>
                            <td>${new Date(comment.date).toLocaleString()}</td>
                            <td>${comment.comment}</td>
                            
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <p>Regards,</p>
            <p>${inquiryData.companyCode}</p>
        </div>
    `;

    // Define email options
    const mailOptions = {
        from: senderEmail,
        to: inquiryData.email, // Customer's email address
        subject: `Inquiry Status Update: ${inquiryData.title}`,
        html: emailContent
    };

    // Send the email
    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully.');
    } catch (error) {
        console.error('Error sending email:', error);
    }
}


async function sendInformingEmail(inquiryData) {

    const senderEmail = 'nipun.dilhan1@gmail.com';
    const transporter = nodemailer.createTransport({
        service: 'gmail', // You can use another SMTP service
        auth: {
            user: senderEmail, // Your email address
            pass: 'fdbdrmztwflqghbt' // Your email password or App Password (for Gmail)
        }
    });

    // Prepare the header image URL
    const headerImageUrl = `https://slbis-photos.onrender.com/header.jpg`; // Replace 'yourBaseUrl' with your actual base URL

    // Prepare the email content
    const emailContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;width: 96%;">
            <img src="${headerImageUrl}" alt="Header Image" style="width: 96%; height: 12%;" />
            <p>Dear ${inquiryData.customerName}, </p></br>
            <p>We are happy to inform you that your inquiry has been informed to <strong>${inquiryData.companyCode}</strong>.</p></br>
            <p><strong>Inquiry Details:</strong></p>
            <p>Inquiry Number: ${inquiryData.inquiryNumber}</p>
            <p>Title: ${inquiryData.title}</p>       
            <p>Date: ${inquiryData.date}</p>
            <p>Customer email: ${inquiryData.email}</p>
            <p>Description: ${inquiryData.description}</p> 

            <p>Regards,</p>
            <p>${inquiryData.companyCode}</p>
        </div>
    `;

    // Define email options
    const mailOptions = {
        from: senderEmail,
        to: inquiryData.email, // Customer's email address
        subject: `Inquiry Status Update: ${inquiryData.title}`,
        html: emailContent
    };

    // Send the email
    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully.');
    } catch (error) {
        console.error('Error sending email:', error);
    }
}


async function sendReport2mail(inquiryData ,company, year , month , total) {

    const senderEmail = 'nipun.dilhan1@gmail.com';
    const transporter = nodemailer.createTransport({
        service: 'gmail', // You can use another SMTP service
        auth: {
            user: senderEmail, // Your email address
            pass: 'fdbdrmztwflqghbt' // Your email password or App Password (for Gmail)
        }
    });

    // Prepare the header image URL
    const headerImageUrl = `https://slbis-photos.onrender.com/header.jpg`; // Replace 'yourBaseUrl' with your actual base URL

    // Prepare the email content
    const emailContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;width: 96%;">
        <img src="${headerImageUrl}" alt="Header Image" style="width: 96%; height: 12%;" />
        <p>Dear Team,</p>
        
        <p>We are pleased to provide an update on the inquiry status for <strong>${company}</strong> for the period of <strong>${month} / ${year}</strong>.</p>
        <p><strong>TOTAL INQUIRIES -  ${total}</strong> </P>
        <p><strong>Inquiry Summary:</strong></p>
        <table border="1" style="width: 90%; border-collapse: collapse; margin-top: 10px;">
            <thead>
                <tr>
                    <th>Category</th>
                    <th>Low</th>
                    <th>Medium</th>
                    <th>High</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${inquiryData.map(data => `
                    <tr>
                        <td>${data.category}</td>
                        <td>${data.priorities.LOW !== undefined ? data.priorities.LOW : '-'}</td>
                        <td>${data.priorities.MEDIUM !== undefined ? data.priorities.MEDIUM : '-'}</td>
                        <td>${data.priorities.HIGH !== undefined ? data.priorities.HIGH : '-'}</td>
                        <td>${data.TOTAL}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <p>We appreciate your continued support.</p>
        <p>Regards,</p>
        <p><strong>SLBIS-CCS Team</strong></p>
    </div>
`;

    // Define email options
    const mailOptions = {
        from: senderEmail,
        to: "nipundilhanjayarathne@gmail.com", // Customer's email address
        subject: `Inquiry Status Report: ${company}`,
        html: emailContent
    };

    // Send the email
    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully.');
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

const generateInquiryReport = async (year, month) => {
    const db = await connectDB();
    const inquiriesCollection = db.collection('inquiries');
    
    const matchStage = { year };
    if (month !== 0) {
        matchStage.month = month;
    }
    
    const report = await inquiriesCollection.aggregate([
        { $match: matchStage },
        { $group: {
            _id: { companyCode: "$companyCode", category: "$category" },
            count: { $sum: 1 }
        }},
        { $group: {
            _id: "$_id.companyCode",
            categories: {
                $push: { k: "$_id.category", v: "$count" }
            },
            total: { $sum: "$count" }
        }},
        { $project: {
            _id: 0,
            companyCode: "$_id",
            categories: { $arrayToObject: "$categories" },
            TOTAL: "$total"
        }}
    ]).toArray();
    
    return report;
};

const generateCompanyCategoryPriorityReport = async (companyCode, year, month) => {
    const db = await connectDB();
    const inquiriesCollection = db.collection('inquiries');
    
    const matchStage = { companyCode, year };
    if (month !== 0) {
        matchStage.month = month;
    }
    
    const report = await inquiriesCollection.aggregate([
        { $match: matchStage },
        { $group: {
            _id: { category: "$category", priorityLevel: "$priorityLevel" },
            count: { $sum: 1 }
        }},
        { $group: {
            _id: "$_id.category",
            priorities: {
                $push: { k: "$_id.priorityLevel", v: "$count" }
            },
            total: { $sum: "$count" }
        }},
        { $project: {
            _id: 0,
            category: "$_id",
            priorities: { $arrayToObject: "$priorities" },
            TOTAL: "$total"
        }}
    ]).toArray();
    
    return report;
};

const sendReport2 = async (companyCode, year, month) => {

    const report = await generateCompanyCategoryPriorityReport(companyCode , year , month);

    const totalSum = report.reduce((sum, item) => sum + item.TOTAL, 0);

    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

    sendReport2mail(report ,companyCode , year , monthName , totalSum);
}





module.exports = { 
    addInquiry, 
    getAllInquiries, 
    findByEmail, 
    findByCompanyAndStatus,
    findByInquiryId ,
    deleteInquiryById,
    addInquiryComment,
    addInquiryMessage,
    getFirst10Inquiries,
    changeInquiryStatus,
    generateCompanyCategoryPriorityReport,
    generateInquiryReport,
    sendReport2
};