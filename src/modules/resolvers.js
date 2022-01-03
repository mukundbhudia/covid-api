const { logger } = require('../modules/logger')
const { getDBClient, connectCache } = require('./dbClient')
const { cacheClient } = connectCache()

const CACHE_TTL_IN_MINS = process.env.CACHE_TTL_IN_MINS || 10 // Time in minutes key lives in cache
const CACHE_TTL = CACHE_TTL_IN_MINS * 60 // Time in seconds key lives in cache
const TOTALS_COLLECTION = 'totals'
const CASES_BY_LOCATION_COLLECTION = 'casesByLocation'

// The root provides a resolver function for each API endpoint
const root = {
  globalTimeSeries: async () => {
    const dbClient = await getDBClient()
    const cachedGlobalTimeSeries = await cacheClient.get(`globalTimeSeries`)

    let timeSeriesTotalCasesByDate = null

    if (cachedGlobalTimeSeries) {
      timeSeriesTotalCasesByDate = JSON.parse(cachedGlobalTimeSeries)
      logger.debug('globalTimeSeries from cache')
    } else {
      let result = await dbClient.collection(TOTALS_COLLECTION).findOne()
      timeSeriesTotalCasesByDate = result.timeSeriesTotalCasesByDate
      cacheClient.set(
        `globalTimeSeries`,
        JSON.stringify(timeSeriesTotalCasesByDate),
        { ex: CACHE_TTL }
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
    const cachedAllDaysWithCases = await cacheClient.get(`allDaysWithCases`)

    let allDaysWithCases = null

    if (cachedAllDaysWithCases) {
      allDaysWithCases = JSON.parse(cachedAllDaysWithCases)
      logger.debug('allDaysWithCases from cache')
    } else {
      let result = await dbClient.collection(TOTALS_COLLECTION).findOne()
      allDaysWithCases = result.globalCasesByDate.map((cases) => {
        return cases.day
      })
      cacheClient.set(`allDaysWithCases`, JSON.stringify(allDaysWithCases), {
        ex: CACHE_TTL,
      })
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
      const cachedGlobalCasesByDate = await cacheClient.get(
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
        cacheClient.set(
          `globalCasesByDate-${args.day}`,
          JSON.stringify(globalCasesByDate),
          { ex: CACHE_TTL }
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
      const cachedCasesByIdKey = await cacheClient.get(
        `casesByIdKey-${args.idKey}`
      )

      let casesByIdKey = null

      if (cachedCasesByIdKey) {
        casesByIdKey = JSON.parse(cachedCasesByIdKey)
        logger.debug('casesByIdKey from cache')
      } else {
        casesByIdKey = await dbClient
          .collection(CASES_BY_LOCATION_COLLECTION)
          .find({ idKey: args.idKey })
          .toArray()
        cacheClient.set(
          `casesByIdKey-${args.idKey}`,
          JSON.stringify(casesByIdKey),
          { ex: CACHE_TTL }
        )
        logger.debug('casesByIdKey from db')
      }
      logger.debug(
        `Resolver 'getCasesByIdKey' with: ${casesByIdKey.length} cases for '${args.idKey}'`
      )
      return casesByIdKey
    }
  },
  getManyCasesByIdKey: async (args) => {
    if (args && args.idKeys) {
      const dbClient = await getDBClient()
      const idKeysAsStrings = args.idKeys.join(':')
      const cachedManyCasesByIdKey = await cacheClient.get(
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
        cacheClient.set(
          `manyCasesByIdKey-${idKeysAsStrings}`,
          JSON.stringify(manyCasesByIdKey),
          { ex: CACHE_TTL }
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

      const cachedProvincesGivenCountryName = await cacheClient.get(
        `provincesGivenCountryName-${args.country}`
      )

      let provincesGivenCountryName = null

      if (cachedProvincesGivenCountryName) {
        provincesGivenCountryName = JSON.parse(cachedProvincesGivenCountryName)
        logger.debug('provincesGivenCountryName from cache')
      } else {
        provincesGivenCountryName = await dbClient
          .collection(CASES_BY_LOCATION_COLLECTION)
          .find({ hasProvince: false, country: args.country })
          .sort({ confirmed: -1 })
          .toArray()
        cacheClient.set(
          `provincesGivenCountryName-${args.country}`,
          JSON.stringify(provincesGivenCountryName),
          { ex: CACHE_TTL }
        )
        logger.debug('provincesGivenCountryName from db')
      }
      logger.debug(
        `Resolver 'getProvincesGivenCountryName' with: ${provincesGivenCountryName.length} cases for '${args.country}'`
      )
      return provincesGivenCountryName
    }
  },
  topXconfirmedByCountry: async (args) => {
    if (args && args.limit) {
      const dbClient = await getDBClient()
      const cachedTopX = await cacheClient.get(
        `topXconfirmedByCountry-${args.limit}`
      )

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
        cacheClient.set(
          `topXconfirmedByCountry-${args.limit}`,
          JSON.stringify(topXconfirmedByCountry),
          { ex: CACHE_TTL }
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
      const cachedTopX = await cacheClient.get(
        `topXactiveByCountry-${args.limit}`
      )

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
        cacheClient.set(
          `topXactiveByCountry-${args.limit}`,
          JSON.stringify(topXactiveByCountry),
          { ex: CACHE_TTL }
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
      const cachedTopX = await cacheClient.get(
        `topXrecoveredByCountry-${args.limit}`
      )

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
        cacheClient.set(
          `topXrecoveredByCountry-${args.limit}`,
          JSON.stringify(topXrecoveredByCountry),
          { ex: CACHE_TTL }
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
      const cachedTopX = await cacheClient.get(
        `topXdeathsByCountry-${args.limit}`
      )

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
        cacheClient.set(
          `topXdeathsByCountry-${args.limit}`,
          JSON.stringify(topXdeathsByCountry),
          { ex: CACHE_TTL }
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
      const cachedTopX = await cacheClient.get(
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
        cacheClient.set(
          `topXconfirmedTodayByCountry-${args.limit}`,
          JSON.stringify(topXconfirmedTodayByCountry),
          { ex: CACHE_TTL }
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
      const cachedTopX = await cacheClient.get(
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
        cacheClient.set(
          `topXdeathsTodayByCountry-${args.limit}`,
          JSON.stringify(topXdeathsTodayByCountry),
          { ex: CACHE_TTL }
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
    const cachedLastUpdated = await cacheClient.get('lastUpdated')
    let timeStamp = null
    if (cachedLastUpdated) {
      timeStamp = JSON.parse(cachedLastUpdated)
      logger.debug('lastUpdated from cache')
    } else {
      let dbResult = await dbClient.collection(TOTALS_COLLECTION).findOne()
      timeStamp = dbResult.timeStamp
      cacheClient.set('lastUpdated', JSON.stringify(timeStamp.getTime()), {
        ex: CACHE_TTL,
      })
      logger.debug('lastUpdated from db')
    }
    logger.debug(
      `Resolver 'lastUpdated' with: '${new Date(timeStamp).toLocaleString()}'`
    )
    return timeStamp
  },
  casesByLocation: async () => {
    const dbClient = await getDBClient()
    const cachedCasesByLocation = await cacheClient.get('casesByLocation')

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
      cacheClient.set('casesByLocation', JSON.stringify(casesByLocation), {
        ex: CACHE_TTL,
      })
      logger.debug('casesByLocation from db')
    }
    logger.debug(
      `Resolver 'casesByLocation' with: ${casesByLocation.length} cases`
    )
    return casesByLocation
  },
  casesByLocationWithNoProvince: async () => {
    const dbClient = await getDBClient()
    const cachedCases = await cacheClient.get('casesByLocationWithNoProvince')

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
      cacheClient.set(
        'casesByLocationWithNoProvince',
        JSON.stringify(casesByLocationWithNoProvince),
        { ex: CACHE_TTL }
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
    const cachedTotalCases = await cacheClient.get('totalCases')

    let totalCases = null

    if (cachedTotalCases) {
      totalCases = JSON.parse(cachedTotalCases)
      logger.debug('totalCases from cache')
    } else {
      totalCases = await dbClient.collection(TOTALS_COLLECTION).findOne()
      cacheClient.set('totalCases', JSON.stringify(totalCases), {
        ex: CACHE_TTL,
      })
      logger.debug('totalCases from db')
    }
    logger.debug(`Resolver 'totalCases'`)
    return totalCases
  },
}

module.exports = {
  root,
}
