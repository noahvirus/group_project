var express = require('express');
var app = express();
const bodyParser = require('body-parser');
const pgp = require('pg-promise')();
const session = require('express-session'); // allow us to save a user's data when they're browsing the website
const bcrypt = require('bcrypt'); // for use with username and password
const axios = require('axios');
const {useEffect} = require('react');
const {useState} = require('react');

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
  var query = `SELECT password,userID FROM users
  WHERE username = $1;`
  db.any(query, [
    req.body.username,
  ])

      .then(async (user) => {
          if (user.length == 0) {
            // then there was no password for username and they need to register
            console.log("Username not registered")
            res.render("pages/register", {
              message: "Username not registered",
              error: "error"
            });
          }
          else {
          const match = await bcrypt.compare(req.body.password, user[0].password);

      if (match) {
        req.session.user = {
          api_key: process.env.API_KEY,
          username: user[0].userid,
          user: req.body.username
        };
        req.session.save();
        console.log(user[0].userid);
        res.redirect('/home')
      }
      else {
        console.log("Incorrect Username or Password")
        res.render("pages/login", {
          message: "Incorrect Username or Password",
          error: "error"
        });
      }
          }
    })
    .catch(function (err) {
      res.send(err);
      console.log("Login Post method errored")
      res.render("pages/register", {
        message: "Login errored. Please Try again",
        error: "error"
      });
    });

});

app.get('/register', (req, res) => {
  res.render('pages/register');
});

// app.get('/home', (req, res) => {
//   res.render('pages/home');
// });

const auth = (req) => {
  if (!req.session.user) {
      // Default to register page.
      return true;
  }
  return false;
};

app.get('/results?:location', (req, res) =>{
  const location = req.query.location;
  axios({
     url: `http://api.weatherapi.com/v1/current.json?key=2f70f3636af24e5cbce181754221811&q=${location}`,
        method: 'GET'
     })
    .then(results => {
      const query = 'Select * FROM cities WHERE city = $1;';
      db.any(query, [location])
      .then(async (data1) => {
        console.log(data1);
        if(data1.length < 1){
          const query1 = 'INSERT into cities (city, country) values ($1, $2);';
          db.any(query1, [location, results.data.location.country])
          .then(async (data2) => {
            //const query = 'SELECT * FROM cities WHERE cityID = (SELECT cityID FROM usersToCities where userID = $1);';
            const query2 = 'Select * FROM cities WHERE city = $1;';
            const query3 = `SELECT c.cityID, c.city, c.country FROM cities c INNER JOIN usersToCities u USING (cityID) WHERE u.userID = $1 `;
            db.any(query2)
            .then(async (data3) => {
              db.any(query3, [req.session.user.username])
              .then(async (data4) => {
                  console.log(data4);
                  res.render("pages/results", {search: results.data, data : data3, data2 : data4, session: req.session});
              })
               .catch(error => {
                console.log(error);
                res.render("pages/error", {message: "Database failure", session: req.session, error: "error"});
               });
            })
             .catch(error => {
              console.log(error);
              res.render("pages/error", {message: "Database failure", session: req.session, error: "error"});
             });
           })
           .catch(error => {
            console.log(error);
            res.render("pages/error", {message: "Could not insert", session: req.session, error: "error"});
           });
        }
        else{
          const query3 = `SELECT c.cityID, c.city, c.country FROM cities c INNER JOIN usersToCities u USING (cityID) WHERE u.userID = $1 `;
          db.any(query3, [req.session.user.username])
          .then(async (data4) => {
              console.log(data4);
              res.render("pages/results", {search: results.data, data : data1, data2 : data4, session: req.session});
          })
           .catch(error => {
            console.log(error);
            res.render("pages/error", {message: "Database failure", session: req.session, error: "error"});
           });
        }
      })
      .catch(err=>{
        console.log(err);
        res.render("pages/error", {message: "City not in database", session: req.session, error: "error"});
      })
    })
    .catch(err=>{
      console.log(err);
      res.render("pages/error", {message: "API call failed", session: req.session, error: "error"});
    })
});

// app.get('/results', (req, res) => {
//   res.render('pages/results');
// });

app.get('/logout', (req, res) => {
  req.session.destroy();
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
    res.render("pages/login", {
      message: "Account Sucessfully Created"
    });
  })
  .catch(function (err) {
      res.render("pages/register", {
        message: "Something went Wrong. Please try Again",
        error: "error"
      });
  });
});


app.get('/home', async (req,res) =>{

  const location = ['Tokyo', 'New York', 'Paris', 'Beijing', 'London'];
  var cities = [];

  for(let i = 0; i < 5; i++) {
    let url = `http://api.weatherapi.com/v1/current.json?key=2f70f3636af24e5cbce181754221811&q=${location[i]}`;
    let response = await axios.get(url);
    cities.push(response);
  }

  res.render('pages/home', {search: cities, session: req.session});

});

// app.get('/clothing', auth, (req, res) => {
//   res.render('pages/clothing');
// });

app.get('/clothing?:place', (req, res) =>{
  const place = req.query.place;
  axios({
    url: `http://api.weatherapi.com/v1/current.json?key=2f70f3636af24e5cbce181754221811&q=${place}`,
        method: 'GET'
    })
    .then(results => {
        console.log(results.data);
        res.render("pages/clothing", {search: results.data}); //pass a parameter to store the values of the api call
    })
    .catch(error => {
      console.log(error);
      res.render("pages/home", {message: "API call failed"});
    });

});

// Server setup
app.listen(3000, function(req, res) {
  console.log("Connected on port:3000");
});

app.get('/discover', (req, res) => {

  if (authenticate(req, res)) {
  const query = 'SELECT * FROM cities;';

  // const query = `SELECT * FROM usersToCities INNER JOIN cities USING (cityID) WHERE userID = ${req.session.user.username};`

  const query2 = `SELECT c.cityID, c.city, c.country FROM cities c INNER JOIN usersToCities u USING (cityID) WHERE u.userID = $1 `

  db.any(query)
      .then(async (data) => {

        db.any(query2, [
          req.session.user.username
      ])
        .then(async (data2) => {
            console.log(data2);
            res.render("pages/discover", {
            data : data,
            data2 : data2
          });

        })
        .catch(function (err) {
          res.send(err);
        });

      })
      .catch(function (err) {
        res.send(err);
      });
    }
});

app.post('/discover/add', (req, res) => {
  //console.log('added');
  const query = 'INSERT into usersToCities (userID, cityID) values ($1, $2) returning *;';

  //console.log(req.session.user.username);
  //console.log(req.body);

    db.any(query, [
      req.session.user.username,
      req.body.cityID
  ])
  .then(function (data) {
    const query = 'SELECT * FROM cities;';

    const query2 = `SELECT c.cityID, c.city, c.country FROM cities c INNER JOIN usersToCities u USING (cityID) WHERE u.userID = $1 `

    db.any(query)
        .then(async (data) => {

          db.any(query2, [
            req.session.user.username
        ])
          .then(async (data2) => {
              console.log(data2);
              res.render("pages/discover", {
              data : data,
              message: `Sucessfully added location`,
              data2 : data2
            });

          })
          .catch(function (err) {
            res.send(err);
          });

        })
        .catch(function (err) {
          res.send(err);
        });
  })
  .catch(function (err) {
      res.redirect('/register');
  });

});

app.post('/discover/remove', (req, res) => {
  //console.log('added');
  const query = 'DELETE FROM usersToCities WHERE userID = $1 AND cityID = $2;';

  //console.log(req.session.user.username);
  //console.log(req.body);

    db.any(query, [
      req.session.user.username,
      req.body.cityID
  ])
  .then(function (data) {
    const query = 'SELECT * FROM cities;';

    const query2 = `SELECT * FROM cities c INNER JOIN usersToCities u USING (cityID) WHERE u.userID = $1 `

    db.any(query)
        .then(async (data) => {

          db.any(query2, [
            req.session.user.username
        ])
          .then(async (data2) => {
              console.log(data2);
              res.render("pages/discover", {
              data : data,
              message: `Sucessfully removed location`,
              data2 : data2
            });

          })
          .catch(function (err) {
            res.send(err);
          });

        })
        .catch(function (err) {
          res.send(err);
        });
  })
  .catch(function (err) {
      res.redirect('/register');
  });

});

const authenticate = (req, res) => {
  if (!req.session.user) {
      // Default to register page.
      res.render("pages/login", {
        message: "Must Log in to use this Feature",
        error: "error"
      });
      return false;
  }
  return true;
};

app.get('/profile', (req, res) => {

  if (authenticate(req, res)) {
  const query2 = `SELECT * FROM cities c INNER JOIN usersToCities u USING (cityID) WHERE u.userID = $1;`

  db.any(query2, [
    req.session.user.username
])
  .then(async (data) => {
      console.log(data);
      res.render('pages/profile', {
      data : data,
      username : req.session.user.user
    });

  })
  .catch(function (err) {
    res.send(err);
  });
}
});

// app.get('/travel', (req, res) => {

//   if (authenticate(req, res)) {
//   const query2 = `SELECT * FROM cities c INNER JOIN usersToCities u USING (cityID) WHERE u.userID = $1;`

//   db.any(query2, [
//     req.session.user.username
// ])
//   .then(async (data) => {
//       console.log(data);
//       res.render('pages/travel', {
//       data : data,
//       username : req.session.user.user
//     });

//   })
//   .catch(function (err) {
//     res.send(err);
//   });
// }
// });

app.get('/clothing?:place', (req, res) =>{
  const place = req.query.place;
  axios({
     url: `http://api.weatherapi.com/v1/current.json?key=2f70f3636af24e5cbce181754221811&q=${place}`,
        method: 'GET'
        // dataType:'json',
        // params: {
        //     "key": req.session.user.api_key,
        //     "q": title, //if these are relevant for our api
        //     "days": 5,
        // }
     })
     .then(results => {
        console.log(results.data)
        res.render("pages/clothing", {current: results.data}); //pass a parameter to store the values of the api call
     })
     .catch(error => {
      console.log(error);
      res.render("pages/home", {message: "API call failed"});
     });
});

// app.get('/clothing', (req, res) => {
//   res.render('pages/clothing');
// });


app.post('/results/add', (req, res) => {
  const query = 'Select * FROM cities WHERE city = $1;';
  db.any(query, [req.body.city])
  .then(async (data) => {
    console.log(data);
    const query1 = 'INSERT into usersToCities (userID, cityID) values ($1, $2) returning *;';
    db.any(query1, [req.session.user.username, data[0].cityid])
    .then(async (data2) => {
      res.redirect("/profile");
    })
    .catch(function (err) {
      console.log(err);
      console.log("second");
      res.redirect('/home');
    });
  })
  .catch(function (err) {
    console.log(err);
    console.log("first");
    res.redirect('/home');
  });
});


app.post('/results/remove', (req, res) => {
  console.log('removed');
  const query = 'DELETE FROM usersToCities WHERE userID = $1 AND cityID = $2;';
    db.any(query, [req.session.user.username, req.body.cityid])
    .then(function (data) {
        res.redirect("/profile");
    })
    .catch(function (err) {
        res.redirect('/register');
    });

});

// app.get('/travel?:place', (req, res) =>{
//   const place = req.query.place;
//   axios({
//     url: `http://api.weatherapi.com/v1/current.json?key=2f70f3636af24e5cbce181754221811&q=${place}`,
//         method: 'GET'
//     })
//     .then(results => {
//         console.log(results.data);
//         res.render("pages/travel", {search: results.data}); //pass a parameter to store the values of the api call
//     })
//     .catch(error => {
//       console.log(error);
//       res.render("pages/home", {message: "API call failed"});
//     });

// });

// app.get('/travel?:place', (req, res) =>{
//   const place = req.query.place;
//   axios({
//      url: `http://api.weatherapi.com/v1/current.json?key=2f70f3636af24e5cbce181754221811&q=${place}`,
//         method: 'GET'
//         // dataType:'json',
//         // params: {
//         //     "key": req.session.user.api_key,
//         //     "q": title, //if these are relevant for our api
//         //     "days": 5,
//         // }
//      })
//      .then(results => {
//         console.log(results.data)
//         res.render("pages/clothing", {current: results.data}); //pass a parameter to store the values of the api call
//      })
//      .catch(error => {
//       console.log(error);
//       res.render("pages/home", {message: "API call failed"});
//      });
// });

// app.post('/travel/add', (req, res) => {
//   //console.log('added');
//   const query = 'INSERT into usersToCities (userID, cityID) values ($1, $2) returning *;';

//   //console.log(req.session.user.username);
//   //console.log(req.body);

//     db.any(query, [
//       req.session.user.username,
//       req.body.cityID
//   ])
//   .then(function (data) {
//     const query = 'SELECT * FROM cities;';

//     const query2 = `SELECT c.cityID, c.city, c.country FROM cities c INNER JOIN usersToCities u USING (cityID) WHERE u.userID = $1 `

//     db.any(query)
//         .then(async (data) => {

//           db.any(query2, [
//             req.session.user.username
//         ])
//           .then(async (data2) => {
//               console.log(data2);
//               res.render("pages/travel", {
//               data : data,
//               message: `Sucessfully added location`,
//               data2 : data2
//             });

//           })
//           .catch(function (err) {
//             res.send(err);
//           });

//         })
//         .catch(function (err) {
//           res.send(err);
//         });
//   })
//   .catch(function (err) {
//       res.redirect('/register');
//   });

// });

// app.post('/travel/remove', (req, res) => {
//   //console.log('added');
//   const query = 'DELETE FROM usersToCities WHERE userID = $1 AND cityID = $2;';

//   //console.log(req.session.user.username);
//   //console.log(req.body);

//     db.any(query, [
//       req.session.user.username,
//       req.body.cityID
//   ])
//   .then(function (data) {
//     const query = 'SELECT * FROM cities;';

//     const query2 = `SELECT * FROM cities c INNER JOIN usersToCities u USING (cityID) WHERE u.userID = $1 `

//     db.any(query)
//         .then(async (data) => {

//           db.any(query2, [
//             req.session.user.username
//         ])
//           .then(async (data2) => {
//               console.log(data2);
//               res.render("pages/travel", {
//               data : data,
//               message: `Sucessfully removed location`,
//               data2 : data2
//             });

//           })
//           .catch(function (err) {
//             res.send(err);
//           });

//         })
//         .catch(function (err) {
//           res.send(err);
//         });
//   })
//   .catch(function (err) {
//       res.redirect('/register');
//   });

// });

// app.get('/travel', (req, res) => {

//   if (authenticate(req, res)) {
//   const query = 'SELECT * FROM cities;';

//   // const query = `SELECT * FROM usersToCities INNER JOIN cities USING (cityID) WHERE userID = ${req.session.user.username};`

//   const query2 = `SELECT c.cityID, c.city, c.country FROM cities c INNER JOIN usersToCities u USING (cityID) WHERE u.userID = $1 `

//   db.any(query)
//       .then(async (data) => {

//         db.any(query2, [
//           req.session.user.username
//       ])
//         .then(async (data2) => {
//             console.log(data2);
//             res.render("pages/travel", {
//             data : data,
//             data2 : data2
//           });

//         })
//         .catch(function (err) {
//           res.send(err);
//         });

//       })
//       .catch(function (err) {
//         res.send(err);
//       });
//     }
// });


app.get('/travel', (req, res) => {

  if (authenticate(req, res)) {
  const query = 'SELECT userID FROM users WHERE userID != $1;';

  // const query = `SELECT * FROM usersToCities INNER JOIN cities USING (cityID) WHERE userID = ${req.session.user.username};`

  const query2 = `SELECT c.city, c.country, c.cityID FROM cities c INNER JOIN usersToCities u USING (cityID) WHERE u.userID = $1;`

  console.log("buttface");

  db.any(query, [req.session.user.username])
      .then(async (data) => {

        console.log(data);
        console.log("-------------------");
        console.log(data.length);

        if (data.length == 0) {
          
          res.render("pages/travel", {
            none: data,
            message: "No other users in Database",
            error: "error",
            session: req.session.user
          });
        }

        var user = data[Math.floor(Math.random()*data.length)].userid;
        console.log(user);

        db.any(query2, [
          user
      ])
        .then(async (data2) => {
            console.log(data2);
            console.log("-----------------------------------");
            res.render("pages/travel", {
            data : data,
            data2 : data2,
            session: req.session.user
          });

        })
        .catch(function (err) {
          res.send(err);
        });

      })
      .catch(function (err) {
        res.send(err);
      });
    }
});
