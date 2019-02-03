const express = require('express')
const bodyParser = require('body-parser')
const graphqlHttp = require('express-graphql')
const {
  buildSchema
} = require('graphql')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const Event = require('./models/event')
const User = require('./models/user')

const app = express()

app.use(bodyParser.json())

app.use('/graphql', graphqlHttp({
  schema: buildSchema(`
    type Event {
      _id: ID!
      title: String!
      description: String!
      price: Float!
      date: String!
      comment: String
    }

    type User {
      _id: ID!
      email: String!
      password: String
    }

    type RootQuery {
      events: [Event!]!
    }

    input EventInput {
      title: String!
      description: String!
      price: Float!
      date: String!
      comment: String
    }

    input UserInput {
      email: String!
      password: String!
    }

    type RootMutation {
      createEvent(eventInput: EventInput): String
      createUser(userInput: UserInput): User
    }

    schema {
      query: RootQuery
      mutation: RootMutation
    }
  `),
  rootValue: {
    events: () => {
      return Event.find()
        .then(events => {
          return events.map(event => {
            return {
              ...event._doc,
              _id: event.id
            }
          })
        })
        .catch(err => {
          console.log(err)
          throw err
        })
    },
    createEvent: args => {
      const event = new Event({
        title: args.eventInput.title,
        description: args.eventInput.description,
        price: args.eventInput.price,
        date: new Date(args.eventInput.date),
        comment: args.eventInput.comment
      })
      event
        .save()
        .then(rs => {
          console.log(rs)
          return { ...rs._doc, _id: rs._doc._id.toString()
          }
        }).catch(err => {
          console.log(err)
          throw err
        })
    },
    createUser: async args => {
      try {
        const gotUser = await User.findOne({ email: args.userInput.email })
        if (gotUser) {
          throw new Error('User already exists.')
        }
        const hashedPassword = await bcrypt.hash(args.userInput.password, 12)
        const user = new User({
          email: args.userInput.email,
          password: hashedPassword
        })
        const result = await user.save()
        return { ...result._doc, _id: result.id }
      } catch (error) {
        throw error
      }
    }
  },
  graphiql: true
}))

// To access databse -> click https://cloud.mongodb.com
mongoose.connect(`mongodb+srv://${
  process.env.MONGO_USER}:${
  process.env.MONGO_PASSWORD}@cluster0-nkwtt.mongodb.net/${
  process.env.MONGO_DB}?retryWrites=tr0ue`)
  .then(() => app.listen(3000))
  .catch(err => console.log(err))

app.get('/', (req, res, next) => {
  res.send('Hello GraphQL')
})
