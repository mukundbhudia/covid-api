const { logger } = require('../modules/logger')
const { getDBClient, connectCache } = require('./dbClient')
const { cacheClient, getAsync } = connectCache()

const CACHE_TTL = 20 * 60 // Time in seconds key lives in cache
const TOTALS_COLLECTION = 'totals'
const CASES_BY_LOCATION_COLLECTION = 'casesByLocation'

// The root provides a resolver function for each API endpoint
const root = {
  globalTimeSeries: async () => {
    const dbClient = await getDBClient()
    const cachedGlobalTimeSeries = await getAsync(`globalTimeSeries`)

    let timeSeriesTotalCasesByDate = null

    if (cachedGlobalTimeSeries) {
      timeSeriesTotalCasesByDate = JSON.parse(cachedGlobalTimeSeries)
      logger.debug('globalTimeSeries from cache')
    } else {
      let result = await dbClient.collection(TOTALS_COLLECTION).findOne()
      timeSeriesTotalCasesByDate = result.timeSeriesTotalCasesByDate
      cacheClient.setex(
        `globalTimeSeries`,
        CACHE_TTL,
        JSON.stringify(timeSeriesTotalCasesByDate)
      )
      logger.debug('globalTimeSeries from db')
    }
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
    const cachedAllDaysWithCases = await getAsync(`allDaysWithCases`)

    let allDaysWithCases = null

    if (cachedAllDaysWithCases) {
      allDaysWithCases = JSON.parse(cachedAllDaysWithCases)
      logger.debug('allDaysWithCases from cache')
    } else {
      let result = await dbClient.collection(TOTALS_COLLECTION).findOne()
      allDaysWithCases = result.globalCasesByDate.map((cases) => {
        return cases.day
      })
      cacheClient.setex(
        `allDaysWithCases`,
        CACHE_TTL,
        JSON.stringify(allDaysWithCases)
      )
      logger.debug('allDaysWithCases from db')
    }
    logger.debug(
      `Resolver 'getAllDaysWithCases' with: ${allDaysWithCases.length} days`
    )

    return allDaysWithCases
  },
  getGlobalCasesByDate: async (args) => {
    if (args && args.day) {
      const dbClient = await getDBClient()
      const cachedGlobalCasesByDate = await getAsync(
        `globalCasesByDate-${args.day}`
      )

      let globalCasesByDate = []

      if (cachedGlobalCasesByDate) {
        globalCasesByDate = JSON.parse(cachedGlobalCasesByDate)
        logger.debug('globalCasesByDate from cache')
      } else {
        let result = await dbClient.collection(TOTALS_COLLECTION).findOne()
        let foundCases = result.globalCasesByDate.filter((globalCase) => {
          return globalCase.day === args.day
        })
        if (foundCases && foundCases.length > 0) {
          globalCasesByDate = foundCases[0].casesOfTheDay
        }
        cacheClient.setex(
          `globalCasesByDate-${args.day}`,
          CACHE_TTL,
          JSON.stringify(globalCasesByDate)
        )
        logger.debug('globalCasesByDate from db')
      }
      logger.debug(
        `Resolver 'getGlobalCasesByDate' with: ${globalCasesByDate.length} cases for '${args.day}'`
      )
      return globalCasesByDate
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
      const idKeysAsStrings = args.idKeys.join(':')
      const cachedManyCasesByIdKey = await getAsync(
        `manyCasesByIdKey-${idKeysAsStrings}`
      )

      let manyCasesByIdKey = null

      if (cachedManyCasesByIdKey) {
        manyCasesByIdKey = JSON.parse(cachedManyCasesByIdKey)
        logger.debug('manyCasesByIdKey from cache')
      } else {
        manyCasesByIdKey = await dbClient
          .collection(CASES_BY_LOCATION_COLLECTION)
          .find({ idKey: { $in: args.idKeys } })
          .toArray()
        cacheClient.setex(
          `manyCasesByIdKey-${idKeysAsStrings}`,
          CACHE_TTL,
          JSON.stringify(manyCasesByIdKey)
        )
        logger.debug('manyCasesByIdKey from db')
      }
      logger.debug(
        `Resolver 'getManyCasesByIdKey' with: ${manyCasesByIdKey.length} cases for '${args.idKeys}'`
      )
      return manyCasesByIdKey
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
      const cachedTopX = await getAsync(`topXconfirmedByCountry-${args.limit}`)

      let topXconfirmedByCountry = null

      if (cachedTopX) {
        topXconfirmedByCountry = JSON.parse(cachedTopX)
        logger.debug('topXconfirmedByCountry from cache')
      } else {
        topXconfirmedByCountry = await dbClient
          .collection(CASES_BY_LOCATION_COLLECTION)
          .find({ province: null })
          .sort({ confirmed: -1 })
          .limit(args.limit)
          .toArray()
        cacheClient.setex(
          `topXconfirmedByCountry-${args.limit}`,
          CACHE_TTL,
          JSON.stringify(topXconfirmedByCountry)
        )
        logger.debug('topXconfirmedByCountry from db')
      }
      logger.debug(
        `Resolver 'topXconfirmedByCountry' with: ${topXconfirmedByCountry.length} cases for '${args.limit}'`
      )
      return topXconfirmedByCountry
    }
  },
  topXactiveByCountry: async (args) => {
    if (args && args.limit) {
      const dbClient = await getDBClient()
      const cachedTopX = await getAsync(`topXactiveByCountry-${args.limit}`)

      let topXactiveByCountry = null

      if (cachedTopX) {
        topXactiveByCountry = JSON.parse(cachedTopX)
        logger.debug('topXactiveByCountry from cache')
      } else {
        topXactiveByCountry = await dbClient
          .collection(CASES_BY_LOCATION_COLLECTION)
          .find({ province: null })
          .sort({ active: -1 })
          .limit(args.limit)
          .toArray()
        cacheClient.setex(
          `topXactiveByCountry-${args.limit}`,
          CACHE_TTL,
          JSON.stringify(topXactiveByCountry)
        )
        logger.debug('topXactiveByCountry from db')
      }
      logger.debug(
        `Resolver 'topXactiveByCountry' with: ${topXactiveByCountry.length} cases for '${args.limit}'`
      )
      return topXactiveByCountry
    }
  },
  topXrecoveredByCountry: async (args) => {
    if (args && args.limit) {
      const dbClient = await getDBClient()
      const cachedTopX = await getAsync(`topXrecoveredByCountry-${args.limit}`)

      let topXrecoveredByCountry = null

      if (cachedTopX) {
        topXrecoveredByCountry = JSON.parse(cachedTopX)
        logger.debug('topXrecoveredByCountry from cache')
      } else {
        topXrecoveredByCountry = await dbClient
          .collection(CASES_BY_LOCATION_COLLECTION)
          .find({ province: null })
          .sort({ recovered: -1 })
          .limit(args.limit)
          .toArray()
        cacheClient.setex(
          `topXrecoveredByCountry-${args.limit}`,
          CACHE_TTL,
          JSON.stringify(topXrecoveredByCountry)
        )
        logger.debug('topXrecoveredByCountry from db')
      }
      logger.debug(
        `Resolver 'topXrecoveredByCountry' with: ${topXrecoveredByCountry.length} cases for '${args.limit}'`
      )
      return topXrecoveredByCountry
    }
  },
  topXdeathsByCountry: async (args) => {
    if (args && args.limit) {
      const dbClient = await getDBClient()
      const cachedTopX = await getAsync(`topXdeathsByCountry-${args.limit}`)

      let topXdeathsByCountry = null

      if (cachedTopX) {
        topXdeathsByCountry = JSON.parse(cachedTopX)
        logger.debug('topXdeathsByCountry from cache')
      } else {
        topXdeathsByCountry = await dbClient
          .collection(CASES_BY_LOCATION_COLLECTION)
          .find({ province: null })
          .sort({ deaths: -1 })
          .limit(args.limit)
          .toArray()
        cacheClient.setex(
          `topXdeathsByCountry-${args.limit}`,
          CACHE_TTL,
          JSON.stringify(topXdeathsByCountry)
        )
        logger.debug('topXdeathsByCountry from db')
      }
      logger.debug(
        `Resolver 'topXdeathsByCountry' with: ${topXdeathsByCountry.length} cases for '${args.limit}'`
      )
      return topXdeathsByCountry
    }
  },
  topXconfirmedTodayByCountry: async (args) => {
    if (args && args.limit) {
      const dbClient = await getDBClient()
      const cachedTopX = await getAsync(
        `topXconfirmedTodayByCountry-${args.limit}`
      )

      let topXconfirmedTodayByCountry = null

      if (cachedTopX) {
        topXconfirmedTodayByCountry = JSON.parse(cachedTopX)
        logger.debug('topXconfirmedTodayByCountry from cache')
      } else {
        topXconfirmedTodayByCountry = await dbClient
          .collection(CASES_BY_LOCATION_COLLECTION)
          .find({ province: null })
          .sort({ confirmedCasesToday: -1 })
          .limit(args.limit)
          .toArray()
        cacheClient.setex(
          `topXconfirmedTodayByCountry-${args.limit}`,
          CACHE_TTL,
          JSON.stringify(topXconfirmedTodayByCountry)
        )
        logger.debug('topXconfirmedTodayByCountry from db')
      }
      logger.debug(
        `Resolver 'topXconfirmedTodayByCountry' with: ${topXconfirmedTodayByCountry.length} cases for '${args.limit}'`
      )
      return topXconfirmedTodayByCountry
    }
  },
  topXdeathsTodayByCountry: async (args) => {
    if (args && args.limit) {
      const dbClient = await getDBClient()
      const cachedTopX = await getAsync(
        `topXdeathsTodayByCountry-${args.limit}`
      )

      let topXdeathsTodayByCountry = null

      if (cachedTopX) {
        topXdeathsTodayByCountry = JSON.parse(cachedTopX)
        logger.debug('topXdeathsTodayByCountry from cache')
      } else {
        topXdeathsTodayByCountry = await dbClient
          .collection(CASES_BY_LOCATION_COLLECTION)
          .find({ province: null })
          .sort({ deathsToday: -1 })
          .limit(args.limit)
          .toArray()
        cacheClient.setex(
          `topXdeathsTodayByCountry-${args.limit}`,
          CACHE_TTL,
          JSON.stringify(topXdeathsTodayByCountry)
        )
        logger.debug('topXdeathsTodayByCountry from db')
      }
      logger.debug(
        `Resolver 'topXdeathsTodayByCountry' with: ${topXdeathsTodayByCountry.length} cases for '${args.limit}'`
      )
      return topXdeathsTodayByCountry
    }
  },
  lastUpdated: async () => {
    const dbClient = await getDBClient()
    const cachedLastUpdated = await getAsync('lastUpdated')
    let timeStamp = null
    if (cachedLastUpdated) {
      timeStamp = JSON.parse(cachedLastUpdated)
      logger.debug('lastUpdated from cache')
    } else {
      let dbResult = await dbClient.collection(TOTALS_COLLECTION).findOne()
      timeStamp = dbResult.timeStamp
      cacheClient.setex(
        'lastUpdated',
        CACHE_TTL,
        JSON.stringify(timeStamp.getTime())
      )
      logger.debug('lastUpdated from db')
    }
    logger.debug(
      `Resolver 'lastUpdated' with: '${new Date(timeStamp).toLocaleString()}'`
    )
    return timeStamp
  },
  casesByLocation: async () => {
    const dbClient = await getDBClient()
    const cachedCasesByLocation = await getAsync('casesByLocation')

    let casesByLocation = null

    if (cachedCasesByLocation) {
      casesByLocation = JSON.parse(cachedCasesByLocation)
      logger.debug('casesByLocation from cache')
    } else {
      casesByLocation = await dbClient
        .collection(CASES_BY_LOCATION_COLLECTION)
        .find({})
        .sort({ province: 1 })
        .toArray()
      cacheClient.setex(
        'casesByLocation',
        CACHE_TTL,
        JSON.stringify(casesByLocation)
      )
      logger.debug('casesByLocation from db')
    }
    logger.debug(
      `Resolver 'casesByLocation' with: ${casesByLocation.length} cases`
    )
    return casesByLocation
  },
  casesByLocationWithNoProvince: async () => {
    const dbClient = await getDBClient()
    const cachedCases = await getAsync('casesByLocationWithNoProvince')

    let casesByLocationWithNoProvince = null

    if (cachedCases) {
      casesByLocationWithNoProvince = JSON.parse(cachedCases)
      logger.debug('casesByLocationWithNoProvince from cache')
    } else {
      // We make an exception for Greenland as some datasets consider it to be it's on country
      casesByLocationWithNoProvince = await dbClient
        .collection(CASES_BY_LOCATION_COLLECTION)
        .find({ $or: [{ province: null }, { province: 'Greenland' }] })
        .sort({ country: 1 })
        .toArray()
      cacheClient.setex(
        'casesByLocationWithNoProvince',
        CACHE_TTL,
        JSON.stringify(casesByLocationWithNoProvince)
      )
      logger.debug('casesByLocationWithNoProvince from db')
    }

    logger.debug(
      `Resolver 'casesByLocationWithNoProvince' with: ${casesByLocationWithNoProvince.length} cases`
    )
    return casesByLocationWithNoProvince
  },
  totalCases: async () => {
    const dbClient = await getDBClient()
    const cachedTotalCases = await getAsync('totalCases')

    let totalCases = null

    if (cachedTotalCases) {
      totalCases = JSON.parse(cachedTotalCases)
      logger.debug('totalCases from cache')
    } else {
      totalCases = await dbClient.collection(TOTALS_COLLECTION).findOne()
      cacheClient.setex('totalCases', CACHE_TTL, JSON.stringify(totalCases))
      logger.debug('totalCases from db')
    }
    logger.debug(`Resolver 'totalCases'`)
    return totalCases
  },
}

module.exports = {
  root,
}
