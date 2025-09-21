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
const GoogleStrategy = require("passport-google-oauth20").Strategy
const session = require("express-session")
const nodemailer = require("nodemailer")
const crypto = require("crypto")

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

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || "your-google-client-id",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "your-google-client-secret",
    callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });
        
        if (user) {
            return done(null, user);
        }
        
        // Check if user exists with same email
        user = await User.findOne({ email: profile.emails[0].value });
        if (user) {
            user.googleId = profile.id;
            user.isVerified = true; // Google accounts are pre-verified
            await user.save();
            return done(null, user);
        }
        
        // Create new user
        user = new User({
            googleId: profile.id,
            username: profile.displayName,
            email: profile.emails[0].value,
            isVerified: true // Google accounts are pre-verified
        });
        
        await user.save();
        done(null, user);
    } catch (error) {
        done(error, null);
    }
}));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Email transporter setup
const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
        user: "manmohansingh@iipe.ac.in",
        pass: "mklz gity kqia hzaw"
    }
});

app.use((req, res, next) => {
    res.locals.success = req.flash("success")
    res.locals.error = req.flash("error")
    res.locals.currUser = req.user;
    next()
})


app.get("/",(req,res)=>{
    res.render("listings/index.ejs")
})

// Google Auth Routes
app.get("/auth/google", passport.authenticate("google", {
    scope: ["profile", "email"]
}));

app.get("/auth/google/callback", 
    passport.authenticate("google", { failureRedirect: "/" }),
    (req, res) => {
        req.flash("success", "Welcome to Workly!");
        res.redirect("/");
    }
);

// Email verification route
app.get("/verify-email/:token", wrapAsync(async (req, res) => {
    const { token } = req.params;
    
    const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: Date.now() }
    });
    
    if (!user) {
        req.flash("error", "Invalid or expired verification token");
        return res.redirect("/");
    }
    
    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    
    req.flash("success", "Email verified successfully! You can now log in.");
    res.redirect("/");
}));

// Send verification email function
async function sendVerificationEmail(user, req) {
    const token = crypto.randomBytes(32).toString('hex');
    
    user.emailVerificationToken = token;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();
    
    const verificationUrl = `${req.protocol}://${req.get('host')}/verify-email/${token}`;
    
    const mailOptions = {
        from: "manmohansingh@iipe.ac.in",
        to: user.email,
        subject: 'Verify Your Workly Account',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #00ff88;">Welcome to Workly!</h2>
                <p>Thank you for signing up. Please click the button below to verify your email address:</p>
                <a href="${verificationUrl}" style="display: inline-block; background: #00ff88; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Verify Email</a>
                <p>Or copy and paste this link in your browser:</p>
                <p>${verificationUrl}</p>
                <p>This link will expire in 24 hours.</p>
                <p>If you didn't create this account, please ignore this email.</p>
            </div>
        `
    };
    
    await transporter.sendMail(mailOptions);
}

app.post("/signup", wrapAsync(async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        const registeredUser = await User.register(
            { username, email }, 
            password
        );
        
        // Send verification email
        await sendVerificationEmail(registeredUser, req);
        
        req.flash("success", "Registration successful! Please check your email to verify your account before logging in.");
        res.redirect("/");
    } catch (e) {
        console.error("Registration error:", e);
        req.flash("error", e.message);
        res.redirect("/");
    }
}));

// Custom login middleware to check email verification
app.post("/login", (req, res, next) => {
    passport.authenticate("local", async (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            req.flash("error", "Invalid credentials");
            return res.redirect("/");
        }
        if (!user.isVerified) {
            req.flash("error", "Please verify your email before logging in. Check your inbox for the verification link.");
            return res.redirect("/");
        }
        
        req.logIn(user, (err) => {
            if (err) return next(err);
            req.flash("success", "Welcome back to Workly!");
            res.redirect("/");
        });
    })(req, res, next);
});

// Resend verification email route
app.post("/resend-verification", wrapAsync(async (req, res) => {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
        req.flash("error", "No account found with that email address");
        return res.redirect("/");
    }
    
    if (user.isVerified) {
        req.flash("error", "This account is already verified");
        return res.redirect("/");
    }
    
    await sendVerificationEmail(user, req);
    req.flash("success", "Verification email sent! Please check your inbox.");
    res.redirect("/");
}));

app.post("/login-old", passport.authenticate("local", { 
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
