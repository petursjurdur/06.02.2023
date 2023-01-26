if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
  }
  
  const express = require('express')
  const app = express()
  const bcrypt = require('bcrypt')
  const flash = require('express-flash')
  const session = require('express-session')
  const methodOverride = require('method-override')
  

  //Database
  const sqlite3 = require('sqlite3').verbose();
  const db = new sqlite3.Database('database.db');
  

  
  app.set('view-engine', 'ejs')
  app.use(express.urlencoded({ extended: false }))
  app.use(flash())
  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  }))
  app.use(methodOverride('_method'))
  
  app.get('/', checkAuthenticated, (req, res) => {
    db.all(`SELECT users.username, messages.message FROM messages INNER JOIN users ON messages.senderID = users.userID;`, (err, rows) =>{
      if(err){
        throw err
      } 
      console.log(rows)
      res.render('index.ejs', { name: req.session.username, messages: rows })
    })
  })
  
  app.get('/login', /*checkNotAuthenticated,*/ (req, res) => {
    res.render('login.ejs')
  })
  
  app.post('/login', express.urlencoded({ extended: false }), function (req, res) {
    
    // login logic to validate req.body.user and req.body.pass
    // would be implemented here. for this example any combo works
    function checkUser(email){
      db.get(`SELECT * from users WHERE email = '${email}'`, (err, row) =>{
        if(err){
          throw err
        } 
         findUser(row, req.body.password)
      })
    }

    async function findUser(row, password){
      if(row === undefined){
        console.log('No user')
        redirect('/login')
    }
const match = await bcrypt.compare(password, row.password).catch();
if(match){
  console.log('Correct password:', match)
 // regenerate the session, which is good practice to help
 // guard against forms of session fixation
    req.session.regenerate(function (err) {
      if (err) next(err)
      req.session.userID = row.userID
      req.session.email = row.email
      req.session.password = row.password
      req.session.username = row.username
  
      // save the session before redirection to ensure page
      // load does not happen before session is saved
      req.session.save(function (err) {
        if (err) return next(err)
        res.redirect('/')
      })
    })

  }}  

  if(req.session.email === undefined){
    console.log('no error here')
    checkUser(req.body.email)
    
  }else {
    console.log('error here')
    res.redirect ('/login')
    
  }
})


  app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register.ejs')
  })
  
  app.post('/register', checkNotAuthenticated, async (req, res) => {
      bcrypt.hash(req.body.password, 10, function(err, hash){
        db.get(`SELECT * FROM users WHERE email = '${req.body.email}'; `, (err, row) =>{
          if (err){
            throw err
          } if(row !== undefined) {
            redirect('/register')
            console.log('already registered')
          } else {
            db.run(`INSERT INTO users(email, password, username) 
            VALUES ('${req.body.email}', '${hash}', '${req.body.name}');`)
            res.redirect('/login')
          }
        })
      })
  })
  
  app.get('/logout', (req, res, next) => {
    req.session.email = undefined
    req.session.save(function(err) {
      if(err) next(err)
      res.redirect('/login')
    })
  })
  
  function checkAuthenticated(req, res, next) {
    if(req.session.email !== undefined){
      next()
    } else {
      res.redirect('/login')
    }
  }
  
  function checkNotAuthenticated(req, res, next) {
    if (req.session.email === undefined) {
      next()
    }else{
      req.redirect('/')
    }
   
  }
app.post('/addMessage', function(req, res) {
  addMessageToDatabase(req.body.message, req.session.userID)
  res.redirect('/')

})
function addMessageToDatabase(message, userID){
  db.run(
    `INSERT INTO messages(message, senderID) 
    VALUES ('${message}','${userID}')`,
    function (err){
      if(err){
        console.error(err);
      }
    }
    )
  }



  
  app.listen(80)