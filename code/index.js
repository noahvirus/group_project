var express = require('express'); 
var app = express(); 
const bodyParser = require('body-parser');
const pgp = require('pg-promise')();
const session = require('express-session'); // allow us to save a user's data when they're browsing the website
const bcrypt = require('bcrypt'); // for use with username and password
const axios = require('axios');
    
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
        res.redirect('/home')
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

const auth = (req, res, next) => {
  if (!req.session.user) {
      // Default to register page.
      res.redirect('/register');
  }
  next();
  };

app.get('/results?:location', (req, res) =>{ //unfinished
  // const location = req.body.location;
  const location = req.query.location;
  axios({
     url: `http://api.weatherapi.com/v1/current.json?key=ba73658ff1f342cdb37182250220411&q=${location}`,
        method: 'GET'
        // dataType:'json',
        // params: {
        //     "key": req.session.user.api_key,
        //     "q": title, //if these are relevant for our api
        //     "days": 5,
        // }
     })
     .then(results => {
        console.log(results.data); 
        res.render("pages/results", {search: results.data}); //pass a parameter to store the values of the api call
     })
     .catch(error => {
      console.log(error);
      res.render("pages/home", {message: "API call failed"});
     });
});

app.get('/results', (req, res) => {
  res.render('pages/results');
});

app.get('/logout', (req, res) => {
  res.render("pages/login", {
    message: `Successfully logged out`,
  });
});

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