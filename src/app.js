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

const events = eventIds => {
  return Event.find({ _id: { $in: eventIds } })
    .then(events => {
      return events.map(event => {
        return { ...event._doc, _id: event.id, creator: user.bind(this, event.creator) }
      })
    })
    .catch(err => {
      throw err
    })
}

const user = userId => {
  return User.findById(userId)
    .then(user => {
      return { ...user._doc, _id: user.id, createEvent: events.bind(this, user._doc.createdEvents) }
    })
    .catch(err => {
      throw err
    })
}

app.use('/graphql', graphqlHttp({
  schema: buildSchema(`
    type Event {
      _id: ID!
      title: String!
      description: String!
      price: Float!
      date: String!
      comment: String
      creator: User!
    }

    type User {
      _id: ID!
      email: String!
      password: String
      createdEvents: [Event!]
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
              _id: event.id,
              creator: user.bind(this, event._doc.creator)
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
        price: +args.eventInput.price,
        date: new Date(args.eventInput.date),
        comment: args.eventInput.comment,
        creator: '5c5691b5743df3485cbb6567'
      })
      let createdEvent
      return event
        .save()
        .then(rs => {
          createdEvent = { ...rs._doc, _id: rs._doc._id.toString(), creator: user.bind(this, rs._doc.creator) }
          return User.findById('5c5691b5743df3485cbb6567')
        })
        .then(user => {
          if (!user) {
            throw new Error('User not found.')
          }
          user.createdEvents.push(event)
          return user.save()
        })
        .then(result => {
          return createdEvent
        })
        .catch(err => {
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
  process.env.MONGO_DB}?retryWrites=tr0ue`, {
  useNewUrlParser: true
})
  .then(() => app.listen(3000))
  .catch(err => console.log(err))

app.get('/', (req, res, next) => {
  res.send('Hello GraphQL')
})
