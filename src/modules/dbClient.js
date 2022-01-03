const { MongoClient } = require('mongodb')
const redis = require('redis')
const { promisify } = require('util')

let client
const DB_NAME = process.env.MONGO_DB || 'covid19'

const connectDB = async () => {
  let dbURI = process.env.MONGO_URI || 'mongodb://localhost:27017'

  try {
    client = await MongoClient.connect(dbURI, { useUnifiedTopology: true })
  } catch (error) {
    console.error(error)
    logger.error(error)
    process.exit(1)
  }
}

const connectCache = () => {
  const REDIS_URL = process.env.REDIS_URL || 6379
  try {
    cacheClient = redis.createClient(REDIS_URL)
    cacheClient.on('error', (error) => {
      console.error(error)
    })
    cacheClient.connect()
    return { cacheClient }
  } catch (error) {
    console.error(error)
    logger.error(error)
    process.exit(1)
  }
}

const disconnectDB = () => client.close()
const getDBClient = async () => client.db(DB_NAME)
const getClient = async () => client

module.exports = {
  connectDB,
  connectCache,
  disconnectDB,
  getDBClient,
  getClient,
}
