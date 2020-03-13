import express from 'express'
import graphqlHTTP from 'express-graphql'
import { buildSchema } from 'graphql'

const PORT = 4000

// Construct a schema, using GraphQL schema language
const schema = buildSchema(`
  type CasesByCountry {
    active: Int!
    confirmed: Int!
    deaths: Int!
    recovered: Int!
    latitude: String!
    longitude: String!
  }

  type Query {
    hello: String
    casesByCountry: CasesByCountry
  }
`)

// The root provides a resolver function for each API endpoint
const root = {
  hello: () => {
    return 'Hello world!'
  },
  casesByCountry: () => {
    return {
      active: 0,
      confirmed: 0,
      deaths: 0,
      recovered: 0,
      latitude: "0",
      longitude: "0",
    }
  }
}

const app = express()
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}))
app.listen(PORT)
console.log(`Running a GraphQL API server at http://localhost:${PORT}/graphql`)
