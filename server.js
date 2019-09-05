//include the express library here
let express = require('express');
//initialising an instance of express
let app = express();

//including the bodyParser package so that we can use the 'body' keyword
let bodyParser = require('body-parser');

//including the mongodb module so that we can use mongodb 
let mongodb = require('mongodb');

//including the ejs rendering engine so that we can use the rendering engine
let ejs = require('ejs');

//initialising the rendering engine that will be using the EJS engine which will be able to renderFile
app.engine('html', ejs.renderFile);
//setting the view engine to be used for html
app.set('view engine', 'html');
//telling the app that static image will be stored in the folder, image and express can look for it from there
app.use(express.static('style'));
app.use(express.static('image'));

const MongoClient = mongodb.MongoClient;

//putting the url where the mongodb database can be accessed from
let url = 'mongodb://localhost:27017/';

//initialise a db object to null first
let db = null;

//initiliase a col object to null first
let col = null;

//the app will use bodyParser to transforms the body into an object so that it can be used
//it will be used to identify the elements within the url and transforms them into a body object
app.use(bodyParser.urlencoded({
    extended: false
}));


MongoClient.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}, function (err, client) {
    if (err) {
        console.log("Error", err);
    } else {
        console.log("Connected successfully to Database");
        db = client.db('taskDb');
        db.createCollection('toDoTasks');
        col = db.collection('toDoTasks');
    }
})

//insert new task page: adds new document to the database
//this callback will be called when the link is http://localhost:8080/
app.get('/', function (req, res) {
    console.log('Homepage requested');
    res.sendFile(__dirname + '/views/newTask.html');
});

//responding to a POST request from the HTML form, addNewTask
app.post('/addNewTask', function (req, res) {
    let taskID = getNewID();

    let newTask = {
        taskID: taskID,
        taskName: req.body.taskName,
        assignTo: req.body.assignTo,
        taskDue: new Date(req.body.taskDue),
        taskStatus: req.body.taskStatus,
        taskDesc: req.body.taskDesc
    }

    col.insertOne(newTask, function (err, res) {
        if (err) {
            throw err;
        } else {
            console.log('New Task added');
        }
    });
    res.redirect('/listTask');
});

//function to obtain a new taskID which is randomised
function getNewID() {

    newID = Math.floor(100000 + Math.random() * 1000);

    return newID;
}

//Get all tasks page: shows all the tasks in a table format
app.get('/listTask', function (req, res) {

    let query = {};
    let sort = {
        taskID: 1
    };

    col.find(query).sort(sort).toArray(function (err, result) {
        res.render('listTask.html', {
            taskDb: result
        });
    })

});

//Update task status by taskID: the page takes two inputs: a taskID and a new status (either InProgress or Complete)
//it sets the new status to the task with taskID
app.get('/updateTask', function (req, res) {
    res.sendFile(__dirname + '/views/updateTask.html');
});

app.post('/updateTask', function (req, res) {

    let filter = {
        taskID: parseInt(req.body.taskidold)
    };
    let update = {
        $set: {
            taskStatus: req.body.taskstatusnew
        }
    };

    col.updateOne(filter, update, {
        upsert: true
    }, function (err, result) {
        if (err) {
            throw err;
        } else {
            console.log("Task Update Success");
        }
    });
    res.redirect('/listTask');
});

//Delete task by taskID: the page takes a taskID as input and deletes its task from DB
app.get('/deleteByID', function (req, res) {
    res.sendFile(__dirname + '/views/deleteByID.html');
});

app.post('/deleteByID', function (req, res) {

    let filter = {
        taskID: parseInt(req.body.taskid)
    };

    col.deleteOne(filter, function (err, result) {
        if (err) {
            throw err;
        } else {
            console.log('Task Deleted Success');
        }
    })
    res.redirect('listTask');
})

//delete all the COMPLETED tasks
app.get('/deleteAll', function (req, res) {
    res.sendFile(__dirname + '/views/deleteAll.html');
});

app.post('/deleteAll', function (req, res) {

    let filter = {
        taskStatus: req.body.taskstatus
    };
    col.deleteMany(filter, function (err, result) {
        if (err) {
            throw err;
        } else {
            console.log('Completed Tasks Deleted Successfully');
        }
    })
    res.redirect('/listTask');
});

app.get('/nonSamLee', function (req, res) {

    // { $and: [ { price: { $ne: 1.99 } }, { price: { $exists: true } } ] }

    let filter = {
        $or: [{
            assignTo: {
                $eq: "Sam"
            }
        }, {
            assignTo: {
                $eq: "Lee"
            }
        }]
    };
    let update = {
        $set: {
            assignTo: "Anna",
            taskStatus: "In Progress"
        }
    };

    col.updateMany(filter, update, {
        upsert: true
    }, function (err, result) {
        if (err) {
            throw err;
        } else {
            console.log("Additional Task Update Success");
        }
    });
    res.redirect('/listTask');
});

app.listen(8080);