import express from 'express'
import graphqlHTTP from 'express-graphql'
import { buildSchema } from 'graphql'

const { connectDB, getDBClient, disconnectDB } = require('../src/dbClient')

require('dotenv').config()

const PORT = 4000

// Construct a schema, using GraphQL schema language
const schema = buildSchema(`
  type CasesByLocation {
    active: Int
    confirmed: Int!
    country: String!
    deaths: Int!
    lastUpdate: String!
    latitude: String!
    longitude: String!
    objectId: Int!
    province: String
    recovered: Int!
  }

  type TotalCases {
    totalConfirmed: Int!
    totalRecovered: Int!
    totalDeaths: Int!
  }

  type Query {
    totalCases: TotalCases
    casesByLocation: [CasesByLocation]
    lastUpdated: String!
  }
`)

// The root provides a resolver function for each API endpoint
const root = {
  lastUpdated: async () => {
    await connectDB()
    const dbClient = getDBClient()
    const { timeStamp } = await dbClient.collection('totals').findOne()
    return timeStamp
  },
  casesByLocation: async () => {
    await connectDB()
    const dbClient = getDBClient()
    const { casesByLocation } = await dbClient.collection('casesByLocation').findOne()
    return casesByLocation
  },
  totalCases: async () => {
    await connectDB()
    const dbClient = getDBClient()
    return await dbClient.collection('totals').findOne()
  },
}

const app = express()
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}))
app.listen(PORT)
console.log(`Running a GraphQL API server at http://localhost:${PORT}/graphql`)
