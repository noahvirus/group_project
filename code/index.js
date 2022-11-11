var express = require('express');
var app = express();
const bodyParser = require('body-parser');
const pgp = require('pg-promise')();
const session = require('express-session'); // allow us to save a user's data when they're browsing the website
const bcrypt = require('bcrypt'); // for use with username and password

// Set EJS as templating engine
app.set('view engine', 'ejs');

const dbConfig = { // database connection string - must be made to connect to a database
  host: 'db', // Running in the db container on the docker setup
  port: 5432, // other ports that are commonly known are 80, 8080, 8000, ... etc. You can find these with your terminal
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
};

//create db with
const db = pgp(dbConfig);

app.set('view engine', 'ejs');
app.use(bodyParser.json());

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

app.get('/', (req, res) =>{
  res.redirect('/login'); //this will call the /anotherRoute route in the API
});

app.get("/login", function(req, res) {
  res.render("pages/login");
});


app.post('/login', async (req, res) => {
  //the logic goes here
  const hash = await bcrypt.hash(req.body.password, 10);
  // insert into the database
  var query = `SELECT password FROM users
  WHERE username = $1;`
  db.any(query, [
    req.body.username,
  ])
    // .then((user)) {
    //   console.log("before bcrypt")
    //   console.log(req.body.password)
    //   console.log(user.password)
    //   const match = await bcrypt.compare(req.body.password, user.password);
    //   console.log("after hash")

      .then(async (user) => {
          if (user.length == 0) {
            // then there was no password for username and they need to register
            console.log("Username not registered")
            res.redirect('/register')
          }
          else {
          const match = await bcrypt.compare(req.body.password, user[0].password);

      if (match) {
        req.session.user = {
          api_key: process.env.API_KEY,
        };
        req.session.save();
        res.redirect('/discover')
      }
      else {
        console.log("Incorrect Username or Password")
        res.redirect('/login')
      }
          }
    })
    .catch(function (err) {
      res.send(err);
      console.log("Login Post method errored")
      res.redirect('/login')
    });

  });

app.get('/register', (req, res) => {
  res.render('pages/register');
});


app.get('/home', (req, res) => {
  res.render('pages/home');
});

app.get('/travel', (req, res) => {
  res.render('pages/travel');
});

/*app.post('/travel', async (req, res) => {
  //if not logged in,
  //console.log("You are not logged in")
  //res.redirect ('/login')
  //else
  //
};
});

app.get('/logout', (req, res) => {
  res.render("pages/login", {
    message: `Successfully logged out`,
  });
});*/

app.post('/register', async (req, res) => {
  //the logic goes here

  const query = 'INSERT into users (username, password) values ($1, $2) returning *;';
  const hash = await bcrypt.hash(req.body.password, 10);

  db.any(query, [
      req.body.username,
      hash
  ])
  .then(function (data) {
      res.redirect('/login');
  })
  .catch(function (err) {
      res.redirect('/register');
  });

});

// Server setup
app.listen(3000, function(req, res) {
  console.log("Connected on port:3000");
});

app.post('/home', async (req, res) => {
  const query = 'select * from locations'
  db.one(query)
    .then(async)

});
