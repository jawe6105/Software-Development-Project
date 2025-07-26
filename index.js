//ALL JUST COPY AND PASTED NOT SURE IF IT WORKS YET


// ----------------------------------   DEPENDENCIES  ----------------------------------------------
// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************

const express = require('express'); // To build an application server or API
const app = express();
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const path = require('path');
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require('bcryptjs'); //  To hash passwords
const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part C.

// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
    extname: 'hbs',
    layoutsDir: __dirname + '/views/layouts',
    partialsDir: __dirname + '/views/partials',
});

// database configuration
const dbConfig = {
    host: process.env.POSTGRES_HOST, // the database server
    port: process.env.POSTGRES_PORT,
    database: process.env.POSTGRES_DB, // the database name
    user: process.env.POSTGRES_USER, // the user account to connect with
    password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// test your database
db.connect()
    .then(obj => {
        console.log('Database connection successful'); // you can view this message in the docker compose logs
        obj.done(); // success, release the connection;
    })
    .catch(error => {
        console.log('ERROR:', error.message || error);
    });

// *****************************************************
// <!-- Section 3 : App Settings -->
// *****************************************************

// Register `hbs` as our view engine using its bound `engine()` function.
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// initialize session variables
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        saveUninitialized: false,
        resave: false,
    })
);

app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

app.get('/welcome', (req, res) => { //dummy route for testing
  res.json({status: 'success', message: 'Welcome!'});
});

//------copy and pasted login / register -----

app.get('/register', (req, res) => {
    res.render('pages/register'); //this will call the /anotherRoute route in the API
    console.log("something");
});

// Register
app.post('/register', async (req, res) => {
    //hash the password using bcrypt library


    // To-DO: Insert username and hashed password into the 'users' table

    const username = req.body.username;
    const password = req.body.password;
    const hash = await bcrypt.hash(password, 10);

    const query = `INSERT INTO user_data (username, password) VALUES ($1, $2);`; //change the user_data table to include password. we dont need a login table

    const query2 = `SELECT * FROM user_data WHERE username = $1;`;
    try{
        const dupe = await db.oneOrNone(query2, [username]);
        if(dupe){
            return res.status(400).json({ message: "Failure" });
        }
    } catch(err){
        console.log(err);
    }


    db.none(query, [username, hash])
        .then(data => {
            res.redirect(302, '/login');
        })
        .catch(err => {
            console.log(err);
            res.status(400).json({ message: "Failure" });
        });

});

// -----------LOGIN------------

app.get('/login', (req, res) => {
    res.render('pages/login'); //this will call the /anotherRoute route in the API
});

// Register
app.post('/login', async (req, res) => {
    //hash the password using bcrypt library


    // To-DO: Insert username and hashed password into the 'users' table

    const username = req.body.username;
    const password = req.body.password;

    const query = `SELECT * FROM user_data WHERE username = $1;`;

    db.one(query, [username])
        .then(async user => {

            const match = await bcrypt.compare(password, user.password);
            if (match) {
                req.session.user = user;
                req.session.save();
                res.redirect(302, '/home');

            }
            else {

                console.log("Incorrect username or password.");
                res.render('pages/login').json({ message: "Incorrect username or password." }).status(200);
            }
        })
        .catch(err => {
            console.log(err);
            res.redirect(302, '/register');
        });

});

// -------MIDDLEWARE-----
const auth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
};

app.use(auth);


//MY STUFF

//HOME
app.get('/home', (req, res) => {
    const query = `SELECT * FROM jobs WHERE claimed = FALSE;`;

    db.any(query).then(jobs => {
        console.log(jobs);
        res.render('pages/home', {
            jobs,
        });

    })
        .catch(err => {
            console.log('You have caught an error.', err);
            res.redirect('/login');
        });
});

app.post('/home', (req, res) => {

    const AcceptedId = req.body.job_id;
    const user1 = req.session.user.username;
    const query = `UPDATE jobs SET claimed = TRUE, claimed_by = $2 WHERE job_id = $1;`;

    db.none(query, [AcceptedId, user1]).then(() => {
        console.log("Job accepted");
        res.redirect('/home');
    })
        .catch(err => {
            console.log("There was an error", err);
            res.redirect('/home');
        });


});

// ----------mydata-------
app.get('/mydata', auth, (req, res) => {
    //const query = 'SELECT * FROM jobs;';
    const username = req.session.user.username;

    //let notcompletedpostedjob = [];

    const querycompletedJobs = 'SELECT * FROM jobs WHERE completed = TRUE AND claimed = TRUE AND claimed_by = $1;';
    const querynotcompletedJobs = 'SELECT * FROM jobs WHERE completed = FALSE AND claimed = TRUE AND claimed_by = $1;';
    const querypostedJobs = 'SELECT * FROM jobs WHERE claimed = TRUE AND posted_by = $1;';

    /*
    
    FOUND A BETTER WAY TO DO THIS
    
    db.any(querycompletedJobs, [username])
    .then(finalcompleted => {
        completedJobs = finalcompleted;
    
    });
    
     db.any(querynotcompletedJobs, [username])
    .then(finalnotcompleted => {
        notCompletedJobs = finalnotcompleted;
    });
    
    db.any(querypostedJobs, [username])
    .then(finalposted => {
        postedJobs = finalposted;
    });
    */



    Promise.all([
        db.any(querycompletedJobs, [username]),
        db.any(querynotcompletedJobs, [username]),
        db.any(querypostedJobs, [username])
    ])
        .then((values) => {

            res.render('pages/mydata', {
                completedjobs: values[0],
                notcompletedjobs: values[1],
                postedjobs: values[2]
            });

        })
        .catch(err => {
            console.log(err);
            res.redirect('/home', { message: 'Failed to access your data' });
        });
})



app.post('/mydata_accept', (req, res) => {

    const AcceptedId = req.body.job_id;
    const query = `UPDATE jobs SET completed = TRUE WHERE job_id = $1;`;

    db.none(query, [AcceptedId]).then(() => {
        console.log("Job completed");
        res.redirect('/mydata');
    })
        .catch(err => {
            console.log("There was an error", err);
            res.redirect('/home');
        });


});

app.post('/mydata_addjob', (req, res) => {

    const username = req.session.user.username;
    const title = req.body.job_title;
    const description = req.body.job_description;
    const date = req.body.job_date;
    const query = `INSERT INTO jobs (posted_by, job_description, job_image, job_title, job_date, pay, claimed, completed, claimed_by) VALUES ($1, $3, 'wont work3', $2, $4, 10, FALSE, FALSE, 'Null');`;

    db.none(query, [username, title, description, date]).then(() => {
        console.log("Job Added");
        res.redirect('/mydata');
    })
        .catch(err => {
            console.log("There was an error", err);
            res.redirect('/home');
        });


});





app.post('/mydata_accept', (req, res) => {

    const AcceptedId = req.body.job_id;
    const query = `UPDATE jobs SET completed = TRUE WHERE job_id = $1;`;

    db.none(query, [AcceptedId]).then(() => {
        console.log("Job completed");
        res.redirect('/mydata');
    })
        .catch(err => {
            console.log("There was an error", err);
            res.redirect('/home');
        });


});

app.post('/mydata_addjob', (req, res) => {

    const username = req.session.user.username;
    const title = req.body.job_title;
    const description = req.body.job_description;
    const date = req.body.job_date;
    const query = `INSERT INTO jobs (posted_by, job_description, job_image, job_title, job_date, pay, claimed, completed, claimed_by) VALUES ($1, $3, 'wont work3', $2, $4, 10, FALSE, FALSE, 'Null');`;

    db.none(query, [username, title, description, date]).then(() => {
        console.log("Job Added");
        res.redirect('/mydata');
    })
        .catch(err => {
            console.log("There was an error", err);
            res.redirect('/home');
        });


});




// Start the server and export it
const server = app.listen(3000, () => {
  console.log(`Server running on port 3000`);
});

// Export the server instance so it can be used in tests
module.exports = server;