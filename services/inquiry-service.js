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

    // Prepare the inquiry object
    const inquiry = {
        _id: new ObjectId(),
        title: inquiryData.title,
        companyCode: inquiryData.companyCode,
        description: inquiryData.description,
        date: formatDate(new Date()),
        status: "VERIFICATION_PENDING",
        customerName: inquiryData.customerName,
        email: inquiryData.email,
        contactNo: inquiryData.contactNo,
        attachments: attachmentRefs, // Store the ObjectIds of attachments
        comments: [],
        messages: []
    };

    // Insert the inquiry into the inquiries collection
    await inquiriesCollection.insertOne(inquiry);
}

const skipCount = 12;
async function getAllInquiries() {
    const db = await connectDB();
    const inquiriesCollection = db.collection('inquiries');
    return inquiriesCollection.find().skip(skipCount).toArray();
}

// Function to find inquiries by email and skip the first 12 results
async function findByEmail(email) {
    const db = await connectDB();
    const inquiriesCollection = db.collection('inquiries');
    const query = { email: email };
    return inquiriesCollection.find(query).skip(0).toArray();
}

// Function to find inquiries by company code and status, skipping the first 12 results
async function findByCompanyAndStatus(companyCode, status) {
    const db = await connectDB();
    const inquiriesCollection = db.collection('inquiries');
    const query = { 
        companyCode: companyCode, 
        status: status 
    };
    return inquiriesCollection.find(query).skip(0).toArray();
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
    console.log('Came to here');
    // Check if the status is "COMPLETED" and send email
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
    changeInquiryStatus
};