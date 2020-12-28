if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

var engines = require('consolidate');
const express = require('express')
const http = require('http')
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const path = require('path')
const app = express()
var urlencodedParser = bodyParser.urlencoded({ extended: false })

const initializePassport = require('./passport-config')
initializePassport(
    passport,
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
)

const users = []

app.use(express.urlencoded({ extended: false }))
app.set('views', __dirname + '/views');
app.engine('html', engines.mustache);


app.use('/static', express.static('static'))
app.use('/views', express.static('views'))
app.use('/images', express.static('images'))

app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

app.get('/',  (req, res) => {
    res.status(200).send('home', { name: req.user.name });
    // res.render('home.html', { name: req.user.name })
})
app.get('/tutorial', checkAuthenticated, (req, res) => {
    res.status(200).send('tutorial', { name: req.user.name });
    // res.render('home.html', { name: req.user.name })
})
app.get('/about', checkNotAuthenticated, (req, res) => {
    res.status(200).send('about');
    // res.render('home.html', { name: req.user.name })
})

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.html')
})

app.post('/login', checkNotAuthenticated, urlencodedParser,passport.authenticate('local', {
    successRedirect: '/tutorial',
    failureRedirect: '/login',
    failureFlash: true
}))

app.get('/signup', checkNotAuthenticated, (req, res) => {
    res.render('signup.html')
})

app.post('/signup', checkNotAuthenticated,urlencodedParser, async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        users.push({
            id: Date.now().toString(),
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        })
        res.redirect('/login')
    } catch {
        res.redirect('/signup')
    }
})

app.delete('/logout', (req, res) => {
    req.logOut()
    res.redirect('/login')
})

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }

    res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/tutorial')
    }
    next()
}

app.listen(9000)