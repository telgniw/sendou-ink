require("dotenv").config()
const { ApolloServer } = require("apollo-server-express")
const mongoose = require("mongoose")
const express = require("express")
const compression = require("compression")
const bodyParser = require("body-parser")
const session = require("express-session")
const MongoStore = require("connect-mongo")(session)
const cors = require("cors")
const passport = require("passport")
const DiscordStrategy = require("passport-discord").Strategy
const User = require("./mongoose-models/user")
const Player = require("./mongoose-models/player")
const path = require("path")
const schema = require("./schema")
const mockUser = require("./utils/mocks")

mongoose.set("useFindAndModify", false)
mongoose.set("useCreateIndex", true)

const callbackURL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3001/auth/discord/callback"
    : "https://sendou.ink/auth/discord/callback"

passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL,
      scope: ["identify", "connections"],
    },
    function (accessToken, refreshToken, profile, cb) {
      const userToSave = {
        username: profile.username,
        discriminator: profile.discriminator,
        discord_id: profile.id,
        avatar: profile.avatar,
      }
      for (var i = 0; i < profile.connections.length; i++) {
        const connection = profile.connections[i]
        if (connection.visibility === 1 && connection.verified) {
          if (connection.type === "twitch") {
            userToSave.twitch_name = connection.name.toLowerCase()
          } else if (connection.type === "twitter") {
            userToSave.twitter_name = connection.name.toLowerCase()
          } else if (connection.type === "youtube") {
            userToSave.youtube_name = connection.name
            userToSave.youtube_id = connection.id
          }
        }
      }

      console.log("userToSave", userToSave)
      User.updateOne(
        { discord_id: userToSave.discord_id },
        userToSave,
        { upsert: true },
        function (err, user) {
          return cb(err, userToSave)
        }
      )
    }
  )
)

passport.serializeUser(function (user, done) {
  done(null, user.discord_id)
})

passport.deserializeUser(function (discord_id, done) {
  User.findOne({ discord_id }, function (err, user) {
    done(err, user)
  })
})

console.log("connecting to MongoDB")
let dbName =
  process.env.NODE_ENV === "development" ? "development" : "production"
if (process.env.USE_PRODUCTION_DB) dbName = "production"

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    dbName,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log(`connected to MongoDB (${dbName})`)
  })
  .catch((error) => {
    console.log("error connection to MongoDB:", error.message)
  })

const server = new ApolloServer({
  introspection: true,
  playground: true,
  schema,
  context: ({ req }) => {
    if (process.env.LOGGED_IN) {
      return { user: mockUser }
    }
    return { user: req.user }
  },
})

const app = express()

app.use(bodyParser.json({ limit: "1mb" }))
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }))

app.use(cors())

//https://stackoverflow.com/questions/8605720/how-to-force-ssl-https-in-express-js/31144924#31144924

function requireHTTPS(req, res, next) {
  // The 'x-forwarded-proto' check is for Heroku
  if (
    !req.secure &&
    req.get("x-forwarded-proto") !== "https" &&
    process.env.NODE_ENV !== "development"
  ) {
    return res.redirect("https://" + req.get("host") + req.url)
  }
  next()
}

app.use(requireHTTPS)

//https://www.npmjs.com/package/express-session

let sess = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1209600000 }, // 2 weeks
  store: new MongoStore({
    mongooseConnection: mongoose.connection,
    touchAfter: 24 * 3600,
  }),
}

if (process.env.NODE_ENV === "production") {
  sess.cookie.secure = true
  app.set("trust proxy", 1)
}

app.use(session(sess))

app.use(compression())

app.use(express.static("build"))

app.use(passport.initialize())
app.use(passport.session())

server.applyMiddleware({ app })

app.get("/auth/discord", passport.authenticate("discord"))

app.get(
  "/auth/discord/callback",
  passport.authenticate("discord", {
    failureRedirect: "/404",
  }),
  function (req, res) {
    res.redirect("/u/" + req.user.discord_id) // Successful auth
  }
)

app.get("/logout", function (req, res) {
  req.logout()
  res.redirect("/")
})

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "build", "index.html"))
})

const PORT = process.env.PORT || 3001
app.listen({ port: PORT }, () => {
  console.log(`Server running on http://localhost:${PORT}${server.graphqlPath}`)
})
