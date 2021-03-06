/* eslint-disable camelcase */
/* eslint-disable indent */
/* eslint-disable prettier/prettier */
// Requiring our models and passport as we've configured it
const db = require("../models");
const passport = require("../config/passport");


module.exports = function (app) {
  // Using the passport.authenticate middleware with our local strategy.
  // If the user has valid login credentials, send them to the members page.
  // Otherwise the user will be sent an error
  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.json({
      email: req.user.email,
      id: req.user.id
    });
  });
  
  app.get("/api/genres", (req, res) => {
    db.Genre.findAll().then(result => res.json(result));
  });
  app.get("/api/instruments", (req, res) => {
    db.Instrument.findAll().then(result => res.json(result));
  });

  app.get("/api/artists/all", (req, res) => {
    db.artist.findAll({
      include: [{
        model: db.Genre,
        required: true,
      }, {
        model: db.Instrument,
        required: true,
      }]
    }).then(result => {
      res.json(result);
    });
  });

  app.get("/api/artists/both/:genreId/:instrumentId", (req, res) => {
    db.artist.findAll({
      include: [{
        model: db.Genre,
        required: true,
        through: { where: { genreId: req.params.genreId } }
      }, {
        model: db.Instrument,
        required: true,
        through: { where: { instrumentId: req.params.instrumentId } }
      }]
    }).then(result => {
      res.json(result);
    });
  });

  app.get("/api/artists/genre/:genreId", (req, res) => {
    db.artist.findAll({
      include: [{
        model: db.Genre,
        required: true,
        through: { where: { genreId: req.params.genreId } }
      }, {
        model: db.Instrument,
        required: true
      }]
    }).then(result => {
      res.json(result);
    });
  });

  app.get("/api/artists/instrument/:instrumentId", (req, res) => {
    db.artist.findAll({
      include: [{
        model: db.Genre,
        required: true,
      }, {
        model: db.Instrument,
        required: true,
        through: { where: { instrumentId: req.params.instrumentId } }
      }]
    }).then(result => {
      res.json(result);
    });
  });
  // Route for signing up a user. The user's password is automatically hashed and stored securely thanks to
  // how we configured our Sequelize User Model. If the user is created successfully, proceed to log the user in,
  // otherwise send back an error
  app.post("/api/user/signup", (req, res) => {
    db.User.create({
      email: req.body.email,
      password: req.body.password
    })
      .then(User => {
        return db.artist.create({
          userId: User.id,
          first_name: req.body.first_name,
          last_name: req.body.last_name,
          artist_bio: req.body.artist_bio
        });
      })
      .then(artist => {
        return Promise.all([artist.setInstruments(req.body.instrument_value), artist.setGenres(req.body.genre_value)]);

      })
      .then(() => {
        res.redirect(307, "/api/login");
      })
      .catch(err => {
        res.status(401).json(err);
      });
  });

  // Route for logging user out
  app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
  });

  // Route for getting some data about our user to be used client side
  app.get("/api/user_data", (req, res) => {
    if (!req.user) {
      // The user is not logged in, send back an empty object
      res.json("ERROR, email already in use");
    } else {
      // Otherwise send back the user's email and id
      // Sending back a password, even a hashed password, isn't a good idea
      res.json({
        email: req.user.email,
        id: req.user.id
      });
    }
  });
};





