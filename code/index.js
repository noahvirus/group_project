var express = require('express'); 
var app = express(); 
    
// Set EJS as templating engine 
app.set('view engine', 'ejs'); 

app.get('/', (req, res) =>{
  res.redirect('/login'); //this will call the /anotherRoute route in the API
});
  
app.get("/login", function(req, res) {  
  res.render("pages/login");
});

app.get('/register', (req, res) => {
  res.render('pages/register');
});
    
// Server setup
app.listen(3000, function(req, res) {
  console.log("Connected on port:3000");
});