const { buildSchema } = require('graphql')

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
    active: Int
    recovered: Int
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
    getManyCasesByIdKey(idKeys: [String]!): [CasesByLocation]
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
    getGlobalCasesByDate(day: String!): [TimeCase]
    getAllDaysWithCases: [String]
  }
`)

module.exports = {
  schema,
}