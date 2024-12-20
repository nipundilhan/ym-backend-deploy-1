// services/moduleService.js
const connectDB = require('../config/db');
const { ObjectId } = require('mongodb');
const { addNotification } = require('../services/notification-service');

// Define the structure of the studentTask when a new one is created
function defineStudentTaskStructure(studentData) {
    
    return {
        _id :  new ObjectId(),
        studentName: studentData.studentName,
        studentId: new ObjectId(studentData.studentId),
        moods: [],
        module1: {
            moduleCode: "MOD1",
            game1: {
                gameCode: "GM01",
                gamePoints: 0,
                // badge1Achieved : "NO",
                // badge2Achieved : "NO",
                // badge3Achieved : "NO",
                badge1Shared : "NO",
                badge2Shared : "NO",
                badge3Shared : "NO",
                tasks: [] // Tasks array will contain objects with the following structure:
                /*
                    Task Object Structure:
                    {
                        _id: new ObjectId(),        // ObjectId, unique identifier for the task
                        name: (String),             // Name of the task
                        description: (String),      // Description of the task
                        date: (Date),               // Date of task creation or completion
                        status: (String),           // Task status, e.g., 'completed', 'pending'
                        completePercentage: (Number),// Completion percentage (if relevant)
                        points: (Number)            // Points assigned based on task status
                    }
                */
            },            
            game2: {
                gameCode: "GM02",
                gamePoints: 0, // Initialize to 1 for the new entry
                // badge1Achieved : "NO",
                // badge2Achieved : "NO",
                // badge3Achieved : "NO",
                badge1Shared : "NO",
                badge2Shared : "NO",
                badge3Shared : "NO",
                mindMaps: []
            },
            game3: {
                gameCode: "GM03",
                gamePoints: 0,
                // badge1Achieved : "NO",
                // badge2Achieved : "NO",
                // badge3Achieved : "NO",
                badge1Shared : "NO",
                badge2Shared : "NO",
                badge3Shared : "NO",
                QandA: [] 
            },
            game4: {
                gameCode: "GM04",
                gamePoints: 0,
                // badge1Achieved : "NO",
                // badge2Achieved : "NO",
                // badge3Achieved : "NO",
                badge1Shared : "NO",
                badge2Shared : "NO",
                badge3Shared : "NO",
                breathingPractises: [] 
            },
            game5: {
                gameCode: "GM05",
                gamePoints: 0,
                // badge1Achieved : "NO",
                // badge2Achieved : "NO",
                // badge3Achieved : "NO",
                badge1Shared : "NO",
                badge2Shared : "NO",
                badge3Shared : "NO",
                journalLogs: [] 
            }
        }
    };
}

function formatDate(date) {
    // Extract the date part (yyyy-mm-dd)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based, so add 1
    const day = String(date.getDate()).padStart(2, '0');

    // Format the time part (hh:mm AM/PM)
    const options = {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    };
    const time = new Intl.DateTimeFormat('en-US', options).format(date);

    // Return the full formatted date string in "yyyy-mm-dd hh:mm AM/PM" format
    return `${year}-${month}-${day} ${time}`;
}

async function findByModuleCode(moduleCode) {
    const db = await connectDB();
    const collection = db.collection('modules');

    // Find a document with the specified moduleCode
    const result = await collection.findOne({ moduleCode: moduleCode });

    if (!result) {
        throw new Error('Module not found');
    }

    return result;
}


async function getGameDetails(moduleCode, gameCode) {

    const db = await connectDB();
    const collection = db.collection('modules');

    // Find the module by moduleCode and the specific game by its code
    const module = await collection.findOne(
        { moduleCode, "games.code": gameCode },
        { projection: { "games.$": 1 } } // Select only the matching game from the array
    );

    if (!module || module.games.length === 0) {
        throw new Error('Game not found in the specified module');
    }


    const game = module.games[0]; // The matched game
    return { 
        name: game.name,
        achievementMargin1: game.achievementMargin1 !== undefined ? game.achievementMargin1 : undefined,
        achievementMargin2: game.achievementMargin2 !== undefined ? game.achievementMargin2 : undefined,
        likesMargin: game.likesMargin !== undefined ? game.likesMargin : undefined
    };

}


async function findStudentGameMarks(studentId) {

    const moduleDetails = await findByModuleCode("MD01");

    const game1Details = await getGameDetails("MD01", "GM01");
    const game2Details = await getGameDetails("MD01", "GM02");
    const game3Details = await getGameDetails("MD01", "GM03");
    const game4Details = await getGameDetails("MD01", "GM04");
    const game5Details = await getGameDetails("MD01", "GM05");

    const db = await connectDB();
    const collection = db.collection('studentTasks');
    
    // Convert the studentId to an ObjectId if it's not already
    const query = { studentId: new ObjectId(studentId) };
    
    // Find the first document with the matching studentId
    const result = await collection.findOne(query);

    if (!result) {
        throw new Error('Student not found');
    }


    
   const stdnt = await getUserByIdLocal(studentId);
        



    // Generate complete moods array (recorded + missing days)
    const completeMoods = generateCompleteMoods(result.moods);

    
    const response = {
        taskId : result._id,
        avatarCode : stdnt.avatarCode,
        dob : stdnt.dob,
        gender : stdnt.gender,
        examDate : moduleDetails.examDate,
        totalMarks: calculateTotalMarks(result) ,
        //game1CompletedTasks: result.module1.game1.tasks.length,
        game1CompletedTasks: result.module1.game1.gamePoints,
        game1Marks: result.module1.game1.gamePoints,
        game1Margin1: game1Details.achievementMargin1,
        game1Margin2: game1Details.achievementMargin2,
        game1Badge1Shared: result.module1.game1.badge1Shared,
        game1Badge2Shared: result.module1.game1.badge2Shared,
        game1Badge3Shared: result.module1.game1.badge3Shared,

        game2Marks: result.module1.game2.gamePoints,
        game2Likes: calculateGame2TotalLikes(result),
        game2Margin1: game2Details.achievementMargin1,
        game2Margin2: game2Details.achievementMargin2,
        game2LikesMargin: game2Details.likesMargin,
        game2Badge1Shared: result.module1.game2.badge1Shared,
        game2Badge2Shared: result.module1.game2.badge1Shared,
        game2Badge3Shared: result.module1.game2.badge1Shared,

        game3Marks: result.module1.game3.gamePoints,
        game3Likes: calculateGame3TotalLikes(result),
        game3Margin1: game3Details.achievementMargin1,
        game3Margin2: game3Details.achievementMargin2,
        game3LikesMargin: game3Details.likesMargin,
        game3Badge1Shared: result.module1.game3.badge1Shared,
        game3Badge2Shared: result.module1.game3.badge1Shared,
        game3Badge3Shared: result.module1.game3.badge1Shared,

        game4Marks: result.module1.game4.gamePoints,
        game4Margin1: game4Details.achievementMargin1,
        game4Margin2: game4Details.achievementMargin2,
        game4Badge1Shared: result.module1.game4.badge1Shared,
        game4Badge2Shared: result.module1.game4.badge1Shared,
        game4Badge3Shared: result.module1.game4.badge1Shared,

        game5Marks: result.module1.game5.gamePoints,
        game5Margin1: game5Details.achievementMargin1,
        game5Margin2: game5Details.achievementMargin2,
        game5badge1Shared: result.module1.game5.badge1Shared,
        game5badge2Shared: result.module1.game5.badge2Shared,
        game5badge3Shared: result.module1.game5.badge3Shared,
        moods: completeMoods,
    };
    
    /*

    const response = {
        taskId: result._id,
        avatarCode: stdnt.avatarCode,
        examDate: moduleDetails.examDate,
        totalMarks: calculateTotalMarks(result),
        game1: {
            game1CompletedTasks: result.module1.game1.gamePoints,
            Marks: result.module1.game1.gamePoints,
            Margin1: game1Details.achievementMargin1,
            Margin2: game1Details.achievementMargin2,
        },
        game2: {
            Marks: result.module1.game2.gamePoints,
            Likes: calculateGame3TotalLikes(result),
            Margin1: game2Details.achievementMargin1,
            Margin2: game2Details.achievementMargin2,
            LikesMargin: game2Details.likesMargin,
        },
        game3: {
            game3Marks: result.module1.game3.gamePoints,
            game3Likes: calculateGame3TotalLikes(result),
            game3Margin1: game3Details.achievementMargin1,
            game3Margin2: game3Details.achievementMargin2,
            game3LikesMargin: game3Details.likesMargin,
        },
        game4: {
            game4Marks: result.module1.game4.gamePoints,
            game4Margin1: game4Details.achievementMargin1,
            game4Margin2: game4Details.achievementMargin2,
        },
        game5: {
            game5Marks: result.module1.game5.gamePoints,
            game5Margin1: game5Details.achievementMargin1,
            game5Margin2: game5Details.achievementMargin2,
            game5badge1Shared: result.module1.game5.badge1Shared,
            game5badge2Shared: result.module1.game5.badge2Shared,
            game5badge3Shared: result.module1.game5.badge3Shared,
        },
        moods: completeMoods,
    };
    */

    // Check if game2 exists before adding it to the response
    if (result.module1.game2) {
        response.game2Marks = result.module1.game2.gamePoints;
    }

    return response;
}

async function getUserByIdLocal(id) {
    const db = await connectDB();
    const collection = db.collection('users');

    try {
        const user = await collection.findOne({ _id: new ObjectId(id) });
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    } catch (error) {
        throw new Error(`Error fetching user: ${error.message}`);
    }
}

function calculateTotalMarks(result) {
    // Assuming total marks is the sum of gamePoints and other logic if needed
    return result.module1.game1.gamePoints + result.module1.game2.gamePoints+ result.module1.game3.gamePoints+ result.module1.game4.gamePoints+ result.module1.game5.gamePoints;; // Replace with the actual logic if different
}

function calculateGame3TotalLikes(result) {
    const game3 = result.module1.game3;

    // Compute likesCount for each QandA and totalLikesCount for all QandA
    let totalLikesCount = 0;

    const qAndAData = game3.QandA.map(qAndA => {
        const likesCount = qAndA.likes ? qAndA.likes.length : 0;
        totalLikesCount += likesCount;
    });

    return totalLikesCount;
}

function calculateGame2TotalLikes(result) {
    const game3 = result.module1.game2;

    // Compute likesCount for each QandA and totalLikesCount for all QandA
    let totalLikesCount = 0;

    const qAndAData = game3.mindMaps.map(mM => {
        const likesCount = mM.likes ? mM.likes.length : 0;
        totalLikesCount += likesCount;
    });

    return totalLikesCount;
}



function generateCompleteMoods(moods) {
    // Helper function to format date to 'yyyy-mm-dd'
    const formatDate = (date) => date.toISOString().split('T')[0];

    // Helper function to get last 30 days as an array of dates
    const getLast30Days = () => {
        const dates = [];
        const today = new Date();
        for (let i = 0; i < 30; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            dates.push(formatDate(d));
        }
        return dates;
    };

    // Extract recorded moods
    const recordedMoods = moods.map(mood => ({
        date: formatDate(new Date(mood.date)),
        mood: mood.mood
    }));

    // Get all dates for the last 30 days
    const last30Days = getLast30Days();

    // Create a complete moods array, filling in missing days with the dummy mood
    const completeMoods = last30Days.map(date => {
        const recordedMood = recordedMoods.find(m => m.date === date);
        return recordedMood ? recordedMood : { date, mood: 'missed' };
    });

    return completeMoods;
}

async function shareBadge(data) {
    const db = await connectDB();
    const collection = db.collection('studentTasks');

    // change this to student id 
    //const studentTaskObjectId = new ObjectId(studentTaskId);
    let studentTask = await collection.findOne({ studentId: new ObjectId(data.studentId) });

    //

 

    const badgePath = `module1.${data.gameCode.toLowerCase()}.${data.badgeCode.toLowerCase()}Shared`;

    console.log(badgePath);
    // Update the badge sharing status
    const result = await collection.updateOne(
        { studentId: new ObjectId(data.studentId) },
        { $set: { [badgePath]: "YES" } }
    );

 

    /*

    let result = null;

    if( data.gameCode === "GM01"){
        if( data.badgeCode === "BDG01"){
            result = await collection.updateOne({ studentId: new ObjectId(data.studentId) },{ $set: { "module1.game1.badge1Shared": "YES" } });

        }else if ( data.badgeCode === "BDG02"){
            result = await collection.updateOne({ studentId: new ObjectId(data.studentId) },{ $set: { "module1.game1.badge2Shared": "YES" } }); 
        }else if ( data.badgeCode === "BDG03"){
            result = await collection.updateOne({ studentId: new ObjectId(data.studentId) },{ $set: { "module1.game1.badge2Shared": "YES" } });
        }
    }else if ( data.gameCode === "GM02"){
        if( data.badgeCode === "BDG01"){
            result = await collection.updateOne({ studentId: new ObjectId(data.studentId) },{ $set: { "module1.game2.badge1Shared": "YES" } });
        }else if ( data.badgeCode === "BDG02"){
            result = await collection.updateOne({ studentId: new ObjectId(data.studentId) },{ $set: { "module1.game2.badge2Shared": "YES" } });
        }else if ( data.badgeCode === "BDG03"){
            result = await collection.updateOne({ studentId: new ObjectId(data.studentId) },{ $set: { "module1.game2.badge3Shared": "YES" } });
        }
    }
        */

    addNotification(data);

    // Update the badge1Shared field for game1 in module1
    

    return result;
}



module.exports = { getGameDetails , findStudentGameMarks , defineStudentTaskStructure , calculateTotalMarks ,formatDate , shareBadge};