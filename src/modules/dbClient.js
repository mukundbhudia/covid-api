const { MongoClient } = require('mongodb')

let client
let dbName = 'covid19'

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
const getDBClient = async () => client.db(dbName)
const getClient = async () => client

module.exports = {
  connectDB,
  disconnectDB,
  getDBClient,
  getClient,
}
