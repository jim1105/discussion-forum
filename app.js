const express     = require("express"),
      app         = express(),
      bodyParser  = require("body-parser"),
      bcrypt      = require("bcryptjs"),
      sessions = require("client-sessions"),
      methodOverride = require("method-override"),
      cookieParser = require('cookie-parser'),
      settings = require("./settings"),
      dbSchema = require('./sqlite-schema');


app.use(sessions({
    cookieName: "sessions",
    secret: 'blargadeeblargblarg',
    duration: settings.SESSION_DURATION,
    activeDuration: settings.SESSION_EXTENSION_DURATION,
    cookie: {
      httpOnly: true,
      ephemeral: settings.SESSION_EPHEMERAL_COOKIES,
      secure: settings.SESSION_SECURE_COOKIES
    },
}));

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride('_method'));
app.use(require('connect-multiparty')());
app.use(cookieParser());


app.use(function(req, res, next){
    res.locals.user = '';
    res.locals.error = '';
    if(req.sessions && req.sessions.user){
        var sql = 'SELECT * '
        sql += 'FROM Users '
        sql += 'WHERE email = ? '
        DB.get(sql, req.sessions.user, function(error, user) {
            if(user){
                req.user = user;
                req.user.email = user.email;
                req.sessions.user = user.email;
                res.locals.user = user;
            }
        });
        next();
    } else {
        next();
    }
});

const sqlite3 = require('sqlite3').verbose();
const DB_PATH = ':memory:'
const DB = new sqlite3.Database(DB_PATH, function(err){
    if (err) {
        console.log(err)
        return
    }
    console.log('Connected to ' + DB_PATH + ' database.')
});

DB.exec(dbSchema, function(err){
    if (err) {
        console.log(err)
    }
});

app.get("/", function(req, res){
    res.redirect("/threads");
});



// INDEX - show all threads
app.get("/threads", requireLogin, function(req, res){
    var sql = `SELECT Threads.email as author_email, title, message, post_id, Posts.email as post_email, comment, Posts.thread_id FROM Threads LEFT JOIN Posts ON Threads.thread_id = Posts.thread_id`
    DB.all("SELECT * FROM Threads", function(error, allThreads) {
        if (error) {
            console.log(error)
        } else {
            console.log("Last ID: " + this.lastID)
            console.log("# of Row Changes: " + this.changes)
            DB.all("SELECT * FROM Posts", (err, allPosts) => {
                if (err) {
                  throw err;
                }
                res.render("threads/index",{threads:allThreads, posts:allPosts});
            });
        }
    })
});

function listUserEmails(userEmails) {
    userEmails.forEach(email => {
        console.log(email.thread_id)
    });
}

// CREATE - add new thread to DB
app.post("/threads", function(req, res){
    // get data from form and add to threads array
    var email = req.sessions.user;
    console.log(email);
    var title = req.body.title;
    var message = req.body.message;
    if(message.length < 20) {
        return res.render("./threads/new", {error: 'Descriptions need to be greater than 20 characters'});
    }
    // Create a new thread and save to DB
    var sql= "INSERT INTO Threads (email, title, message) "
    sql += "VALUES (? ,?, ?) "

    DB.run(sql, [email, title, message], function(error, rows) {
        if (error) {
            console.log(error)
        } else {
            console.log("Last ID: " + this.lastID)
            console.log("# of Row Changes: " + this.changes)
        }
    });
    res.redirect("/threads");
});

// NEW - show form to create new thread
app.get("/threads/new",requireLogin, function(req, res){
   res.render("threads/new"); 
});


// ====================
// POSTS ROUTES
// ====================


app.get("/threads/:id/posts/new", function(req, res){
    console.log(req.params.id);
    res.render('posts/new', {id:req.params.id});
});

app.post("/threads/:id/posts", function(req, res){
    console.log("thread's id",req.params.id);
    var email = req.sessions.user;
    var comment = req.body.comment;
    if(comment.length < 20){
        return res.render('posts/new', {id:req.params.id, error: 'Descriptions need to be greater than 20 characters'});
    }
    var thread_id = req.params.id;
    var sql= "INSERT INTO Posts (email, comment, thread_id) "
    sql += "VALUES (? ,?, ?) "

    DB.run(sql, [email, comment, thread_id], function(error, rows) {
        if (error) {
            console.log(error)
        } else {
            console.log("Last ID: " + this.lastID)
            console.log("# of Row Changes: " + this.changes)
            console.log("posts " + rows)
        }
    });
    res.redirect('/threads');
});

//  ===========
// AUTH ROUTES
//  ===========
 
//show register form
app.get("/register", function(req, res){
   res.render("register"); 
});
//handle sign up logic
app.post("/register", function(req, res){

    var email = req.body.email;
    let hash = bcrypt.hashSync(req.body.password, settings.BCRYPT_WORK_FACTOR);
    req.body.password = hash;
    var sql= "INSERT INTO Users (email, password) "
    sql += "VALUES (? ,?) "
    DB.run(sql, [email, hash], function(error, rows) {
        if (error) {
            console.log(error);
            return res.render("register", {
                error: error
            });
            
        } else {
            console.log("Last ID: " + this.lastID)
            console.log("# of Row Changes: " + this.changes)
            console.log("posts " + rows)
            req.sessions.user = email;
            res.redirect("/threads");
        }
    });
});

// show login form
app.get("/login", function(req, res){
   res.render("login"); 
});

// handling login logic
app.post("/login", function(req, res){
    var sql = 'SELECT password '
    sql += 'FROM Users '
    sql += 'WHERE email = ? '

    DB.get(sql, req.body.email, function(error, row) {
        if (!row || !bcrypt.compareSync(req.body.password, row.password)) {
            return res.render("login", {
              error: "Incorrect email / password."
            });
        }
        req.sessions.user = req.body.email;
        res.redirect("/threads");
    });

});

// logout route
app.get("/logout", function(req, res){
    if (req.sessions) {
        req.sessions.reset();
    }
    res.redirect("/threads");
});

//middleware
function requireLogin(req, res, next) {
    if(req.sessions.user) {
        return next();
    }
    res.redirect('/login');
}

const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log("Server Has Started!");
});