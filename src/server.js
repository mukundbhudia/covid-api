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
    getCasesWithCountry(country: String!): [CasesByLocation]
    getCasesWithCountryAndProvince(country: String!, province: String!): [CasesByLocation]
    topXconfirmedByCountry(limit: Int!): [CasesByLocation]
    topXactiveByCountry(limit: Int!): [CasesByLocation]
    topXrecoveredByCountry(limit: Int!): [CasesByLocation]
    topXdeathsByCountry(limit: Int!): [CasesByLocation]
    lastUpdated: String!
    globalTimeSeries: [Cases]
    getAllCountries: [String]
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
  getAllCountries: async () => {
    await connectDB()
    const dbClient = getDBClient()
    const { allCountries } = await dbClient.collection('totals').findOne()
    return allCountries
  },
  getCasesWithCountry: async (args) => {
    if (args && args.country) {
      await connectDB()
      const dbClient = getDBClient()
      const cursor = await dbClient.collection('casesByLocation').find({country: args.country})
      return await cursor.toArray()
    }
  },
  getCasesWithCountryAndProvince: async (args) => {
    if (args && args.country) {
      if (args.province === '') {
        args.province = null
      }
      await connectDB()
      const dbClient = getDBClient()
      const cursor = await dbClient.collection('casesByLocation').find({
        country: args.country,
        province: args.province
      })
      return await cursor.toArray()
    }
  },
  topXconfirmedByCountry: async (args) => {
    if (args && args.limit) {
      await connectDB()
      const dbClient = getDBClient()
      const cursor = await dbClient.collection('casesByLocation').find({'province': null}).sort({'confirmed': -1}).limit(args.limit)
      return await cursor.toArray()
    }
  },
  topXactiveByCountry: async (args) => {
    if (args && args.limit) {
      await connectDB()
      const dbClient = getDBClient()
      const cursor = await dbClient.collection('casesByLocation').find({'province': null}).sort({'active': -1}).limit(args.limit)
      return await cursor.toArray()
    }
  },
  topXrecoveredByCountry: async (args) => {
    if (args && args.limit) {
      await connectDB()
      const dbClient = getDBClient()
      const cursor = await dbClient.collection('casesByLocation').find({'province': null}).sort({'recovered': -1}).limit(args.limit)
      return await cursor.toArray()
    }
  },
  topXdeathsByCountry: async (args) => {
    if (args && args.limit) {
      await connectDB()
      const dbClient = getDBClient()
      const cursor = await dbClient.collection('casesByLocation').find({'province': null}).sort({'deaths': -1}).limit(args.limit)
      return await cursor.toArray()
    }
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
