const express = require('express')
const bodyParser = require('body-parser')
const graphqlHttp = require('express-graphql')
const {
  buildSchema
} = require('graphql')
const mongoose = require('mongoose')

const Event = require('./models/event')

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

    type RootMutation {
      createEvent(eventInput: EventInput): String
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
