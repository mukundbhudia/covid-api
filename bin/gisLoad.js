#!/usr/bin/env node

const { connectDB, getDBClient, getClient, disconnectDB } = require('../src/dbClient')
const processing = require('../src/services/csvProcessing')
const {
  getGisCasesByCountry,
  getGisTotalConfirmed,
  getGisTotalRecovered,
  getGisTotalDeaths
} = require('../src/services/gis')

const {
  getGhTimeSeriesConfirmed,
  getGhTimeSeriesRecovered,
  getGhTimeSeriesDeaths
} = require('../src/services/gitHub')

require('dotenv').config()

const timeSeriesData = async () => {
  const confirmedCases = await getGhTimeSeriesConfirmed()
  const recoveredCases = await getGhTimeSeriesRecovered()
  const deathCases = await getGhTimeSeriesDeaths()
  const result = processing.combineDataFromSources(confirmedCases.data, recoveredCases.data, deathCases.data)
  const keys = Object.keys(result.stats.globalCasesByDate)
  const timeSeries = []
  keys.forEach(day => {
    result.stats.globalCasesByDate[day].day = day
    timeSeries.push(result.stats.globalCasesByDate[day])
  })
  result.stats.globalCasesByDate = timeSeries
  return result
}

const casesByLocation = async () => {
  const { data } = await getGisCasesByCountry()
  return data.features.map(({ attributes }) => ({
    active: attributes.Active,
    confirmed: attributes.Confirmed,
    country: attributes.Country_Region,
    deaths: attributes.Deaths,
    lastUpdate: attributes.Last_Update,
    latitude: attributes.Lat,
    longitude: attributes.Long_,
    objectId: attributes.OBJECTID,
    province: attributes.Province_State,
    recovered: attributes.Recovered
  }))
}

const totalConfirmed = async () => {
  const { data } = await getGisTotalConfirmed()
  return data.features[0].attributes.value
}

const totalRecovered = async () => {
  const { data } = await getGisTotalRecovered()
  return data.features[0].attributes.value
}

const totalDeaths = async () => {
  const { data } = await getGisTotalDeaths()
  return data.features[0].attributes.value
}

const replaceGis = async () => {
  await connectDB()
  const dbClient = getDBClient()
  const session = getClient().startSession()

  const cases = await casesByLocation()
  const timeSeriesCases = await timeSeriesData()
  
  const confirmed = await totalConfirmed()
  const recovered = await totalRecovered()
  const deaths = await totalDeaths()

  const allTotals = {
    confirmed: confirmed,
    recovered: recovered,
    deaths: deaths,
    active : confirmed - (recovered + deaths),
    timeSeriesTotalCasesByDate: timeSeriesCases.stats.globalCasesByDate,
    timeStamp: new Date(),
  }

  if (cases.length > 0 &&
    allTotals.confirmed > 0 &&
    allTotals.recovered > 0 &&
    allTotals.deaths > 0
  ) {
    let combinedCountryCasesWithTimeSeries = []

    timeSeriesCases.collection.forEach((ghCase) => {
      cases.forEach((gisCase) => {
        if (gisCase.country === ghCase.countryRegion) {
          if ((gisCase.province === ghCase.provinceState) || (gisCase.province === null && ghCase.provinceState === '')) {
            gisCase.casesByDate = ghCase.casesByDate
            combinedCountryCasesWithTimeSeries.push(gisCase)
          }
        }
      })
    })
    console.log(`Countries/Regions total: ${combinedCountryCasesWithTimeSeries.length}. (From ${cases.length} GIS cases and ${timeSeriesCases.collection.length} GH cases)`)

    await session.withTransaction(async () => {
      await dbClient.collection('totals').deleteMany({})
      await dbClient.collection('totals').insertOne(allTotals)

      await dbClient.collection('casesByLocation').deleteMany({})
      await dbClient.collection('casesByLocation').insertMany(combinedCountryCasesWithTimeSeries)
    })
  }

  await session.endSession()
  await disconnectDB()
}

const fetchAndReplace = () => {
  try {
    console.log("Fetching services...")
    replaceGis()
  } catch (err) {
    console.error(err)
  } 
}

module.exports = {
  fetchAndReplace: fetchAndReplace
}
