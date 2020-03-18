import express from 'express'
import graphqlHTTP from 'express-graphql'
import { buildSchema } from 'graphql'
import cors from 'cors'
import gisLoad from '../bin/gisLoad'

const { connectDB, getDBClient, disconnectDB } = require('../src/dbClient')

require('dotenv').config()

const PORT = 4000
const SERVICE_FETCH_INTERVAL_IN_MINS = 15

// Initial load
gisLoad.fetchAndReplace()

setInterval(() => {
  try {
    gisLoad.fetchAndReplace()
  } catch (err) {
    console.error(err)
  }
}, 1000 * 60 * SERVICE_FETCH_INTERVAL_IN_MINS)

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
    casesByDate: [Cases]
  }

  type Cases {
    confirmed: Int!
    recovered: Int!
    deaths: Int!
    active: Int!
    day: String
  }

  type Query {
    totalCases: Cases
    casesByLocation: [CasesByLocation]
    lastUpdated: String!
    globalTimeSeries: [Cases]
  }
`)

// The root provides a resolver function for each API endpoint
const root = {
  globalTimeSeries: async () => {
    await connectDB()
    const dbClient = getDBClient()
    const { timeSeriesTotalCasesByDate } = await dbClient.collection('totals').findOne()
    return timeSeriesTotalCasesByDate
  },
  lastUpdated: async () => {
    await connectDB()
    const dbClient = getDBClient()
    const { timeStamp } = await dbClient.collection('totals').findOne()
    return timeStamp
  },
  casesByLocation: async () => {
    await connectDB()
    const dbClient = getDBClient()
    const cursor = await dbClient.collection('casesByLocation').find({})
    return await cursor.toArray()
  },
  totalCases: async () => {
    await connectDB()
    const dbClient = getDBClient()
    return await dbClient.collection('totals').findOne()
  },
}

const app = express()
app.use(cors())
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}))
app.listen(PORT)
console.log(`Running a GraphQL API server at http://localhost:${PORT}/graphql`)
