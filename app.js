const express=require("express")
const app=express()
const path = require("path")
const ejsMate = require("ejs-mate")
const mongoose = require("mongoose")
const mongo_url="mongodb://127.0.0.1:27017/workly"
const User=require("./models/user.js")
const wrapAsync = require("./utils/wrapAsync.js")
const ExpressError = require("./utils/ExpressError.js")
const flash = require("connect-flash")
const passport = require("passport")
const localStrategy = require("passport-local")
const session = require("express-session")

main()
.then(()=>{
    console.log("connected to db")
})
.catch((err)=>{
    console.log(err)
})

async function main(){
    await mongoose.connect(mongo_url) 
}

app.listen(8080,()=>{
    console.log("server is listning on port 8080")
})

app.set("view engine","ejs")
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}))
app.use(express.static(path.join(__dirname,"/public")))
app.engine("ejs",ejsMate)


const sessionOptions = {
  secret: "mysupersecretcode",
  resave: false,
  saveUninitialized: false, 
};

app.use(session(sessionOptions))

app.use(passport.initialize())
app.use(passport.session())
app.use(flash())

passport.use(new localStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req, res, next) => {
    res.locals.success = req.flash("success")
    res.locals.error = req.flash("error")
    res.locals.currUser = req.user;
    next()
})


app.get("/",(req,res)=>{
    res.render("listings/index.ejs")
   
})

app.post("/signup", wrapAsync(async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        const registeredUser = await User.register(
            { username, email }, 
            password
        );
        console.log(registeredUser)
        req.login(registeredUser, (err) => {
            if (err) return next(err);
            req.flash("success", "Welcome to workly!");
            res.redirect("/");
        });
    } catch (e) {
        console.error("Registration error:", e);
        req.flash("error", e.message);
        res.redirect("/");
    }
}));

app.post("/login", passport.authenticate("local", { 
  failureRedirect: '/',
  successRedirect: '/',
  failureFlash: 'Invalid credentials', 
  successFlash: 'Welcome to workly!'   
}));

app.post("/logout", (req, res, next) => {
    req.logOut((err) => {
        if (err) {
            return next(err)
        }
        req.flash("success", "Logout sucessfull")
        res.redirect("/")
    })
})



app.use((err, req, res, next) => {
    let { statusCode = 500, message = "something went wrong" } = err
    // res.status(statusCode).send(message)
    res.render("listings/error.ejs", { statusCode, message })
})
