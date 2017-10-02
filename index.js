import express from 'express';
import bodyParser from 'body-parser';
import { graphiqlConnect, graphqlExpress } from 'apollo-server-express';
import { makeExecutableSchema } from 'graphql-tools';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import { createServer } from 'http';
import { execute, subscribe } from 'graphql';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import _ from 'lodash';
import DataLoader from 'dataloader';
import passport from 'passport';
import FacebookStrategy from 'passport-facebook';
import joinMonsterAdapt from 'join-monster-graphql-tools-adapter';
import dotenv from 'dotenv';

import typeDefs from './schema/';
import resolvers from './resolvers';
import models from './models';
import { batchSuggestions } from './batchedData';
import { createTokens, refreshTokens } from './auth';
import joinMonsterMetadata from './joinMonsterMetadata';

dotenv.load();

const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

joinMonsterAdapt(schema, joinMonsterMetadata);

const SECRET = process.env.SERVER_SECRET;
const PORT = process.env.SERVER_PORT;
const app = express();
const server = createServer(app);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.FACEBOOK_APP_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, cb) => {
      const { id, displayName } = profile;
      // []
      const fbUsers = await models.FbAuth.findAll({
        limit: 1,
        where: { fb_id: id }
      });

      console.log('fbUsers', fbUsers);
      console.log('PROFILE', profile);

      if (!fbUsers || !fbUsers.length) {
        const user = await models.User.create();
        const fbUser = await models.FbAuth.create({
          fb_id: id,
          display_name: displayName,
          user_id: user.id
        });
        fbUsers.push(fbUser);
      }

      cb(null, fbUsers[0]);
    }
  )
);

app.use(passport.initialize());

app.get('/auth/facebook', passport.authenticate('facebook'));

app.get(
  '/auth/facebook/callback',
  passport.authenticate('facebook', {
    failureRedirect: 'http://localhost:8080/world',
    session: false
  }),
  async (req, res) => {
    // Successful authentication, redirect home.
    console.log('FB STRAT REQ', req);
    const [token, refreshToken] = await createTokens(req.user, SECRET);
    res.redirect(
      `http://localhost:8080/home?token=${token}&refreshToken=${refreshToken}`
    );
  }
);

// originally named addUser
const addUserToRequestFromAuthHeaderToken = async (req, res, next) => {
  const token = req.headers['x-token'];
  // console.log('TOKEN', token);
  if (token) {
    try {
      const { user } = await jwt.verify(token, SECRET);
      req.user = user;
    } catch (err) {
      const refreshToken = req.headers['x-refresh-token'];
      const newTokens = await refreshTokens(
        token,
        refreshToken,
        models,
        SECRET
      );
      if (newTokens.token && newTokens.refreshToken) {
        res.set('Access-Control-Expose-Headers', 'x-token, x-refresh-token');
        res.set('x-token', newTokens.token);
        res.set('x-refresh-token', newTokens.refreshToken);
      }
      req.user = newTokens.user;
    }
  }
  // you could put an else clasue here if you wanted to catch all unauth'd users
  // else { throw new Error('authorization is required'); }

  next();
};

app.use(cors('*'));
app.use(addUserToRequestFromAuthHeaderToken);

app.use(
  '/graphiql',
  graphiqlConnect({
    endpointURL: '/graphql'
  })
);

app.use(
  '/graphql',
  bodyParser.json(),
  graphqlExpress(req => ({
    schema,
    context: {
      models,
      SECRET,
      user: req.user,
      suggestionLoader: new DataLoader(keys => batchSuggestions(keys, models))
    }
  }))
);

// force: false will only create new tables
models.sequelize.sync({ force: false }).then(() => {
  server.listen(PORT, () => {
    new SubscriptionServer(
      {
        execute,
        subscribe,
        schema
      },
      {
        server,
        path: '/subscriptions'
      }
    );
  });
});
