const { MongoClient } = require('mongodb')

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

const disconnectDB = () => client.close()
const getDBClient = async () => client.db(DB_NAME)
const getClient = async () => client

module.exports = {
  connectDB,
  disconnectDB,
  getDBClient,
  getClient,
}
