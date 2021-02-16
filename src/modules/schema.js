const { buildSchema } = require('graphql')

// Construct a schema, using GraphQL schema language
const schema = buildSchema(`
  type CasesByLocation {
    idKey: String!
    countryCode: String!
    active: Int
    confirmed: Int!
    country: String!
    deaths: Int!
    confirmedCasesToday: Int!
    deathsToday: Int!
    confirmedPerCapita: Float,
    deathsPerCapita: Float,
    lastUpdate: String!
    latitude: String
    longitude: String
    province: String
    recovered: Int!
    dateOfFirstCase: String
    dateOfFirstDeath: String
    highestDailyConfirmed: HighestCase
    highestDailyDeaths: HighestCase
    casesByDate: [timeSeriesCases]
    provincesList: [Province]
    hasProvince: Boolean
    continent: String
    populationDensity: Float
    medianAge: Float
    aged65older: Float
    aged70older: Float
    gdpPerCapita: Float
    diabetesPrevalence: Float
    cardiovascDeathRate: Float
    lifeExpectancy: Float
    humanDevelopmentIndex: Float
  }

  type HighestCase {
    count: Int
    date: String
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
    confirmedPerCapita: Float!,
    deathsPerCapita: Float!,
    globalPopulation: Float!,
    dateOfFirstCase: String
    dateOfFirstDeath: String
    highestDailyConfirmed: HighestCase
    highestDailyDeaths: HighestCase
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
