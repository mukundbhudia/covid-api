const express = require('express')
const graphqlHTTP = require('express-graphql')
const { buildSchema } = require('graphql')
const cors = require('cors')

const { connectDB, getDBClient, disconnectDB } = require('../src/dbClient')

require('dotenv').config()

const PORT = process.env.PORT || 4000

// Construct a schema, using GraphQL schema language
const schema = buildSchema(`
  type CasesByLocation {
    idKey: String!
    countryCode: String
    active: Int
    confirmed: Int!
    country: String!
    deaths: Int!
    confirmedCasesToday: Int!
    deathsToday: Int!
    lastUpdate: String!
    latitude: String
    longitude: String
    province: String
    recovered: Int!
    casesByDate: [timeSeriesCases]
    provincesList: [Province]
    hasProvince: Boolean
  }

  type Province {
    idKey: String!
    province: String!
  }

  type Cases {
    confirmed: Int!
    recovered: Int!
    deaths: Int!
    active: Int!
    confirmedCasesToday: Int!
    deathsToday: Int!
    day: String
  }

  type timeSeriesCases {
    confirmed: Int!
    deaths: Int!
    confirmedCasesToday: Int!
    deathsToday: Int!
    day: String
  }

  type TimeCase {
    country: String!
    countryCode: String
    idKey: String!
    confirmed: Int!
    deaths: Int!
    confirmedCasesToday: Int!
    deathsToday: Int!
  }

  type GlobalTimeCase {
    day: String
    casesOfTheDay: [TimeCase]
  }

  type Query {
    totalCases: Cases
    casesByLocation: [CasesByLocation]
    casesByLocationWithNoProvince: [CasesByLocation]
    getCasesWithCountry(country: String!): [CasesByLocation]
    getCasesWithCountryAndProvince(country: String!, province: String!): [CasesByLocation]
    getCasesByIdKey(idKey: String!): [CasesByLocation]
    getProvincesGivenCountryName(country: String!): [CasesByLocation]
    topXconfirmedByCountry(limit: Int!): [CasesByLocation]
    topXactiveByCountry(limit: Int!): [CasesByLocation]
    topXrecoveredByCountry(limit: Int!): [CasesByLocation]
    topXdeathsByCountry(limit: Int!): [CasesByLocation]
    topXconfirmedTodayByCountry(limit: Int!): [CasesByLocation]
    topXdeathsTodayByCountry(limit: Int!): [CasesByLocation]
    lastUpdated: String!
    globalTimeSeries: [timeSeriesCases]
    getAllCountries: [String]
    getGlobalCasesByDate: [GlobalTimeCase]
  }
`)

// The root provides a resolver function for each API endpoint
const root = {
  globalTimeSeries: async () => {
    const dbClient = getDBClient()
    const { timeSeriesTotalCasesByDate } = await dbClient.collection('totals').findOne()
    return timeSeriesTotalCasesByDate
  },
  getAllCountries: async () => {
    const dbClient = getDBClient()
    const { allCountries } = await dbClient.collection('totals').findOne()
    return allCountries
  },
  getGlobalCasesByDate: async () => {
    const dbClient = getDBClient()
    const { globalCasesByDate } = await dbClient.collection('totals').findOne()
    return globalCasesByDate
  },
  getCasesByIdKey: async (args) => {
    if (args && args.idKey) {
      const dbClient = getDBClient()
      const cursor = await dbClient.collection('casesByLocation').find({idKey: args.idKey})
      return await cursor.toArray()
    }
  },
  getCasesWithCountry: async (args) => {
    if (args && args.country) {
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
      const dbClient = getDBClient()
      const cursor = await dbClient.collection('casesByLocation').find({
        country: args.country,
        province: args.province
      })
      return await cursor.toArray()
    }
  },
  getProvincesGivenCountryName: async (args) => {
    if (args && args.country) {
      const dbClient = getDBClient()
      const cursor = await dbClient.collection('casesByLocation').find({'hasProvince': false, country: args.country}).sort({'confirmed': -1})
      return await cursor.toArray()
    }
  },
  topXconfirmedByCountry: async (args) => {
    if (args && args.limit) {
      const dbClient = getDBClient()
      const cursor = await dbClient.collection('casesByLocation').find({'province': null}).sort({'confirmed': -1}).limit(args.limit)
      return await cursor.toArray()
    }
  },
  topXactiveByCountry: async (args) => {
    if (args && args.limit) {
      const dbClient = getDBClient()
      const cursor = await dbClient.collection('casesByLocation').find({'province': null}).sort({'active': -1}).limit(args.limit)
      return await cursor.toArray()
    }
  },
  topXrecoveredByCountry: async (args) => {
    if (args && args.limit) {
      const dbClient = getDBClient()
      const cursor = await dbClient.collection('casesByLocation').find({'province': null}).sort({'recovered': -1}).limit(args.limit)
      return await cursor.toArray()
    }
  },
  topXdeathsByCountry: async (args) => {
    if (args && args.limit) {
      const dbClient = getDBClient()
      const cursor = await dbClient.collection('casesByLocation').find({'province': null}).sort({'deaths': -1}).limit(args.limit)
      return await cursor.toArray()
    }
  },
  topXconfirmedTodayByCountry: async (args) => {
    if (args && args.limit) {
      const dbClient = getDBClient()
      const cursor = await dbClient.collection('casesByLocation').find({'province': null}).sort({'confirmedCasesToday': -1}).limit(args.limit)
      return await cursor.toArray()
    }
  },
  topXdeathsTodayByCountry: async (args) => {
    if (args && args.limit) {
      const dbClient = getDBClient()
      const cursor = await dbClient.collection('casesByLocation').find({'province': null}).sort({'deathsToday': -1}).limit(args.limit)
      return await cursor.toArray()
    }
  },
  lastUpdated: async () => {
    const dbClient = getDBClient()
    const { timeStamp } = await dbClient.collection('totals').findOne()
    return timeStamp
  },
  casesByLocation: async () => {
    const dbClient = getDBClient()
    const cursor = await dbClient.collection('casesByLocation').find({})
    return await cursor.toArray()
  },
  casesByLocationWithNoProvince: async () => {
    const dbClient = getDBClient()
    // We make an exception for Greenland as some datasets consider it to be it's on country
    const cursor = await dbClient.collection('casesByLocation').find( { $or: [ { 'province': null }, { 'province': 'Greenland' } ] } )
    return await cursor.toArray()
  },
  totalCases: async () => {
    const dbClient = getDBClient()
    return await dbClient.collection('totals').findOne()
  },
}

const app = express()
const startServer = async () => {
  await connectDB()
  app.use(cors())
  app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
  }))
  app.listen(PORT)
  console.log(`Running a GraphQL API server at http://localhost:${PORT}/graphql`)
}

startServer()
