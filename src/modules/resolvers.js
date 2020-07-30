const { getDBClient } = require('./dbClient')

// The root provides a resolver function for each API endpoint
const root = {
  globalTimeSeries: async () => {
    const dbClient = await getDBClient()
    const { timeSeriesTotalCasesByDate } = await dbClient.collection('totals').findOne()
    return timeSeriesTotalCasesByDate
  },
  getAllCountries: async () => {
    const dbClient = await getDBClient()
    const { allCountries } = await dbClient.collection('totals').findOne()
    return allCountries
  },
  getAllDaysWithCases: async () => {
    const dbClient = await getDBClient()
    const { globalCasesByDate } = await dbClient.collection('totals').findOne()
    return globalCasesByDate.map((cases) => { return cases.day })
  },
  getGlobalCasesByDate: async (args) => {
    if (args && args.day) {
      const dbClient = await getDBClient()
      const { globalCasesByDate } = await dbClient.collection('totals').findOne()
      let results = []
      globalCasesByDate.forEach(globalCase => {
        if (globalCase.day === args.day) {
          results = globalCase.casesOfTheDay
          return results
        }
      })
      return results
    }
  },
  getCasesByIdKey: async (args) => {
    if (args && args.idKey) {
      const dbClient = await getDBClient()
      const cursor = await dbClient.collection('casesByLocation')
        .find({idKey: args.idKey})
      return await cursor.toArray()
    }
  },
  getManyCasesByIdKey: async (args) => {
    if (args && args.idKeys) {
      const dbClient = await getDBClient()
      const cursor = await dbClient.collection('casesByLocation')
        .find({idKey: { "$in" : args.idKeys}})
      return await cursor.toArray()
    }
  },
  getCasesWithCountry: async (args) => {
    if (args && args.country) {
      const dbClient = await getDBClient()
      const cursor = await dbClient.collection('casesByLocation')
        .find({country: args.country})
      return await cursor.toArray()
    }
  },
  getCasesWithCountryAndProvince: async (args) => {
    if (args && args.country) {
      if (args.province === '') {
        args.province = null
      }
      const dbClient = await getDBClient()
      const cursor = await dbClient.collection('casesByLocation').find({
        country: args.country,
        province: args.province
      })
      return await cursor.toArray()
    }
  },
  getProvincesGivenCountryName: async (args) => {
    if (args && args.country) {
      const dbClient = await getDBClient()
      const cursor = await dbClient.collection('casesByLocation')
        .find({'hasProvince': false, country: args.country})
        .sort({'confirmed': -1})
      return await cursor.toArray()
    }
  },
  topXconfirmedByCountry: async (args) => {
    if (args && args.limit) {
      const dbClient = await getDBClient()
      const cursor = await dbClient.collection('casesByLocation')
        .find({'province': null})
        .sort({'confirmed': -1})
        .limit(args.limit)
      return await cursor.toArray()
    }
  },
  topXactiveByCountry: async (args) => {
    if (args && args.limit) {
      const dbClient = await getDBClient()
      const cursor = await dbClient.collection('casesByLocation')
        .find({'province': null})
        .sort({'active': -1})
        .limit(args.limit)
      return await cursor.toArray()
    }
  },
  topXrecoveredByCountry: async (args) => {
    if (args && args.limit) {
      const dbClient = await getDBClient()
      const cursor = await dbClient.collection('casesByLocation')
        .find({'province': null})
        .sort({'recovered': -1})
        .limit(args.limit)
      return await cursor.toArray()
    }
  },
  topXdeathsByCountry: async (args) => {
    if (args && args.limit) {
      const dbClient = await getDBClient()
      const cursor = await dbClient.collection('casesByLocation')
        .find({'province': null})
        .sort({'deaths': -1})
        .limit(args.limit)
      return await cursor.toArray()
    }
  },
  topXconfirmedTodayByCountry: async (args) => {
    if (args && args.limit) {
      const dbClient = await getDBClient()
      const cursor = await dbClient.collection('casesByLocation')
        .find({'province': null})
        .sort({'confirmedCasesToday': -1})
        .limit(args.limit)
      return await cursor.toArray()
    }
  },
  topXdeathsTodayByCountry: async (args) => {
    if (args && args.limit) {
      const dbClient = await getDBClient()
      const cursor = await dbClient.collection('casesByLocation')
        .find({'province': null})
        .sort({'deathsToday': -1})
        .limit(args.limit)
      return await cursor.toArray()
    }
  },
  lastUpdated: async () => {
    const dbClient = await getDBClient()
    const { timeStamp } = await dbClient.collection('totals').findOne()
    return timeStamp
  },
  casesByLocation: async () => {
    const dbClient = await getDBClient()
    const cursor = await dbClient.collection('casesByLocation').find({})
    return await cursor.toArray()
  },
  casesByLocationWithNoProvince: async () => {
    const dbClient = await getDBClient()
    // We make an exception for Greenland as some datasets consider it to be it's on country
    const cursor = await dbClient.collection('casesByLocation')
      .find( { $or: [ { 'province': null }, { 'province': 'Greenland' } ] } )
    return await cursor.toArray()
  },
  totalCases: async () => {
    const dbClient = await getDBClient()
    return await dbClient.collection('totals').findOne()
  },
}

module.exports = {
	root,
}
