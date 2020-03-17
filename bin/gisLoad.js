#!/usr/bin/env node

const { connectDB, getDBClient, getClient, disconnectDB } = require('../src/dbClient')
const {
  getGisCasesByCountry,
  getGisTotalConfirmed,
  getGisTotalRecovered,
  getGisTotalDeaths
} = require('../src/services/gis')
require('dotenv').config()

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

  const allTotals = {
    totalConfirmed: await totalConfirmed(),
    totalRecovered: await totalRecovered(),
    totalDeaths: await totalDeaths(),
    timeStamp: new Date(),
  }

  const cases = await casesByLocation()

  if (cases.length > 0 &&
    allTotals.totalConfirmed > 0 &&
    allTotals.totalRecovered > 0 &&
    allTotals.totalDeaths > 0
  ) {
    await session.withTransaction(async () => {
      await dbClient.collection('totals').deleteMany({})
      await dbClient.collection('totals').insertOne(allTotals)

      await dbClient.collection('casesByLocation').deleteMany({})
      await dbClient.collection('casesByLocation').insertOne( { casesByLocation: cases } )
    })
  }

  await session.endSession()
  await disconnectDB()
}

try {
  replaceGis()
} catch (err) {
  console.error(err)
}
