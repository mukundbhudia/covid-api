import express from 'express'
import graphqlHTTP from 'express-graphql'
import { buildSchema } from 'graphql'

import { getGisCasesByCountry, getGisTotalConfirmed, getGisTotalRecovered, getGisTotalDeaths } from '../services/gis'

const PORT = 4000

// Construct a schema, using GraphQL schema language
const schema = buildSchema(`
  type CasesByLocation {
    active: Int
    confirmed: Int!
    country: String!
    deaths: Int!
    latitude: String!
    longitude: String!
    province: String
    recovered: Int!
  }

  type Query {
    hello: String
    totalConfirmed: Int
    totalRecovered: Int
    totalDeaths: Int
    casesByLocation: [CasesByLocation]
  }
`)

// The root provides a resolver function for each API endpoint
const root = {
  hello: () => {
    return 'Hello world!'
  },
  casesByLocation: async () => {
    const { data } = await getGisCasesByCountry()
    const cases = data.features.map(({ attributes }) => ({
      active: attributes.Active,
      confirmed: attributes.Confirmed,
      country: attributes.Country_Region,
      deaths: attributes.Deaths,
      latitude: attributes.Lat,
      longitude: attributes.Long_,
      province: attributes.Province_State,
      recovered: attributes.Recovered
    }))
    return cases
  },
  totalConfirmed: async () => {
    const { data } = await getGisTotalConfirmed()
    return data.features[0].attributes.value
  },
  totalRecovered: async () => {
    const { data } = await getGisTotalRecovered()
    return data.features[0].attributes.value
  },
  totalDeaths: async () => {
    const { data } = await getGisTotalDeaths()
    return data.features[0].attributes.value
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
