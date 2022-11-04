var express = require('express'); 
var app = express(); 
    
// Set EJS as templating engine 
app.set('view engine', 'ejs'); 
  
app.get("/", function(req, res) {  
  res.render("./views/pages/login.ejs", {name:'Chris Martin'});
});
    
// Server setup
app.listen(3000, function(req, res) {
  console.log("Connected on port:3000");
});