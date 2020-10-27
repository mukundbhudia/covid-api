const { logger } = require('../modules/logger')
const { getDBClient } = require('./dbClient')

const TOTALS_COLLECTION = 'totals'
const CASES_BY_LOCATION_COLLECTION = 'casesByLocation'

// The root provides a resolver function for each API endpoint
const root = {
  globalTimeSeries: async () => {
    const dbClient = await getDBClient()
    const { timeSeriesTotalCasesByDate } = await dbClient
      .collection(TOTALS_COLLECTION)
      .findOne()
    logger.debug(
      `Resolver 'globalTimeSeries' with: ${timeSeriesTotalCasesByDate.length} cases`
    )
    return timeSeriesTotalCasesByDate
  },
  getAllCountries: async () => {
    const dbClient = await getDBClient()
    const { allCountries } = await dbClient
      .collection(TOTALS_COLLECTION)
      .findOne()
    logger.debug(
      `Resolver 'getAllCountries' with: ${allCountries.length} cases`
    )
    return allCountries
  },
  getAllDaysWithCases: async () => {
    const dbClient = await getDBClient()
    const { globalCasesByDate } = await dbClient
      .collection(TOTALS_COLLECTION)
      .findOne()
    logger.debug(
      `Resolver 'getAllDaysWithCases' with: ${globalCasesByDate.length} days`
    )
    return globalCasesByDate.map((cases) => {
      return cases.day
    })
  },
  getGlobalCasesByDate: async (args) => {
    if (args && args.day) {
      const dbClient = await getDBClient()
      const { globalCasesByDate } = await dbClient
        .collection(TOTALS_COLLECTION)
        .findOne()
      let results = []
      globalCasesByDate.forEach((globalCase) => {
        if (globalCase.day === args.day) {
          results = globalCase.casesOfTheDay
          logger.debug(
            `Resolver 'getGlobalCasesByDate' with: ${results.length} cases for '${args.day}'`
          )
          return results
        }
      })
      logger.debug(
        `Resolver 'getGlobalCasesByDate' with: ${results.length} cases for '${args.day}'`
      )
      return results
    }
  },
  getCasesByIdKey: async (args) => {
    if (args && args.idKey) {
      const dbClient = await getDBClient()
      const result = await dbClient
        .collection(CASES_BY_LOCATION_COLLECTION)
        .find({ idKey: args.idKey })
        .toArray()
      logger.debug(
        `Resolver 'getCasesByIdKey' with: ${result.length} cases for '${args.idKey}'`
      )
      return result
    }
  },
  getManyCasesByIdKey: async (args) => {
    if (args && args.idKeys) {
      const dbClient = await getDBClient()
      const result = await dbClient
        .collection(CASES_BY_LOCATION_COLLECTION)
        .find({ idKey: { $in: args.idKeys } })
        .toArray()
      logger.debug(
        `Resolver 'getManyCasesByIdKey' with: ${result.length} cases for '${args.idKeys}'`
      )
      return result
    }
  },
  getCasesWithCountry: async (args) => {
    if (args && args.country) {
      const dbClient = await getDBClient()
      const result = await dbClient
        .collection(CASES_BY_LOCATION_COLLECTION)
        .find({ country: args.country })
        .toArray()
      logger.debug(
        `Resolver 'getCasesWithCountry' with: ${result.length} cases for '${args.country}'`
      )
      return result
    }
  },
  getCasesWithCountryAndProvince: async (args) => {
    if (args && args.country) {
      if (args.province === '') {
        args.province = null
      }
      const dbClient = await getDBClient()
      const result = await dbClient
        .collection(CASES_BY_LOCATION_COLLECTION)
        .find({
          country: args.country,
          province: args.province,
        })
        .toArray()
      logger.debug(
        `Resolver 'getCasesWithCountryAndProvince' with: ${result.length} cases for '${args.country}'`
      )
      return result
    }
  },
  getProvincesGivenCountryName: async (args) => {
    if (args && args.country) {
      const dbClient = await getDBClient()
      const result = await dbClient
        .collection(CASES_BY_LOCATION_COLLECTION)
        .find({ hasProvince: false, country: args.country })
        .sort({ confirmed: -1 })
        .toArray()
      logger.debug(
        `Resolver 'getProvincesGivenCountryName' with: ${result.length} cases for '${args.country}'`
      )
      return result
    }
  },
  topXconfirmedByCountry: async (args) => {
    if (args && args.limit) {
      const dbClient = await getDBClient()
      const result = await dbClient
        .collection(CASES_BY_LOCATION_COLLECTION)
        .find({ province: null })
        .sort({ confirmed: -1 })
        .limit(args.limit)
        .toArray()
      logger.debug(
        `Resolver 'topXconfirmedByCountry' with: ${result.length} cases for '${args.limit}'`
      )
      return result
    }
  },
  topXactiveByCountry: async (args) => {
    if (args && args.limit) {
      const dbClient = await getDBClient()
      const result = await dbClient
        .collection(CASES_BY_LOCATION_COLLECTION)
        .find({ province: null })
        .sort({ active: -1 })
        .limit(args.limit)
        .toArray()
      logger.debug(
        `Resolver 'topXactiveByCountry' with: ${result.length} cases for '${args.limit}'`
      )
      return result
    }
  },
  topXrecoveredByCountry: async (args) => {
    if (args && args.limit) {
      const dbClient = await getDBClient()
      const result = await dbClient
        .collection(CASES_BY_LOCATION_COLLECTION)
        .find({ province: null })
        .sort({ recovered: -1 })
        .limit(args.limit)
        .toArray()
      logger.debug(
        `Resolver 'topXrecoveredByCountry' with: ${result.length} cases for '${args.limit}'`
      )
      return result
    }
  },
  topXdeathsByCountry: async (args) => {
    if (args && args.limit) {
      const dbClient = await getDBClient()
      const result = await dbClient
        .collection(CASES_BY_LOCATION_COLLECTION)
        .find({ province: null })
        .sort({ deaths: -1 })
        .limit(args.limit)
        .toArray()
      logger.debug(
        `Resolver 'topXdeathsByCountry' with: ${result.length} cases for '${args.limit}'`
      )
      return result
    }
  },
  topXconfirmedTodayByCountry: async (args) => {
    if (args && args.limit) {
      const dbClient = await getDBClient()
      const result = await dbClient
        .collection(CASES_BY_LOCATION_COLLECTION)
        .find({ province: null })
        .sort({ confirmedCasesToday: -1 })
        .limit(args.limit)
        .toArray()
      logger.debug(
        `Resolver 'topXconfirmedTodayByCountry' with: ${result.length} cases for '${args.limit}'`
      )
      return result
    }
  },
  topXdeathsTodayByCountry: async (args) => {
    if (args && args.limit) {
      const dbClient = await getDBClient()
      const result = await dbClient
        .collection(CASES_BY_LOCATION_COLLECTION)
        .find({ province: null })
        .sort({ deathsToday: -1 })
        .limit(args.limit)
        .toArray()
      logger.debug(
        `Resolver 'topXdeathsTodayByCountry' with: ${result.length} cases for '${args.limit}'`
      )
      return result
    }
  },
  lastUpdated: async () => {
    const dbClient = await getDBClient()
    const { timeStamp } = await dbClient.collection(TOTALS_COLLECTION).findOne()
    logger.debug(`Resolver 'lastUpdated' with: '${timeStamp.toLocaleString()}'`)
    return timeStamp
  },
  casesByLocation: async () => {
    const dbClient = await getDBClient()
    const result = await dbClient
      .collection(CASES_BY_LOCATION_COLLECTION)
      .find({})
      .sort({ province: 1 })
      .toArray()
    logger.debug(`Resolver 'casesByLocation' with: ${result.length} cases`)
    return result
  },
  casesByLocationWithNoProvince: async () => {
    const dbClient = await getDBClient()
    // We make an exception for Greenland as some datasets consider it to be it's on country
    const result = await dbClient
      .collection(CASES_BY_LOCATION_COLLECTION)
      .find({ $or: [{ province: null }, { province: 'Greenland' }] })
      .sort({ country: 1 })
      .toArray()
    logger.debug(
      `Resolver 'casesByLocationWithNoProvince' with: ${result.length} cases`
    )
    return result
  },
  totalCases: async () => {
    const dbClient = await getDBClient()
    const result = await dbClient.collection(TOTALS_COLLECTION).findOne()
    logger.debug(`Resolver 'totalCases'`)
    return result
  },
}

module.exports = {
  root,
}
