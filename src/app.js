const express = require('express')
const bodyParser = require('body-parser')
const graphqlHttp = require('express-graphql')
const {
  buildSchema
} = require('graphql')

const app = express()

const events = []

app.use(bodyParser.json())

app.listen(3000)

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
      return events
    },
    createEvent: (args) => {
      const event = {
        _id: Math.random().toString(),
        title: args.eventInput.title,
        description: args.eventInput.description,
        price: args.eventInput.price,
        date: new Date().toString(),
        comment: args.eventInput.comment
      }
      events.push(event)
    }
  },
  graphiql: true
}))

app.get('/', (req, res, next) => {
  res.send('Hello GraphQL')
})
