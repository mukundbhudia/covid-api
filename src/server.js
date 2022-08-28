const express = require('express')
const { graphqlHTTP } = require('express-graphql')
const cors = require('cors')
require('dotenv').config()
const { logger } = require('./modules/logger')
const { connectDB } = require('./modules/dbClient')
const { schema } = require('./modules/schema')
const { root } = require('./modules/resolvers')

const SERVER_PORT = process.env.PORT || 4000

const app = express()

const startServer = async () => {
  await connectDB()
  app
    .use(cors())
    .use(
      '/graphql',
      graphqlHTTP({
        schema: schema,
        rootValue: root,
        graphiql: true,
      })
    )
    .get('/healthz', function (_req, res) {
      res.json({ status: 'OK' })
    })
    .listen(SERVER_PORT)

  const mongoUri = process.env.MONGO_URI || ''
  if (mongoUri.length > 25) mongoUri = mongoUri.substring(0, 25)

  const envs = {
    instanceEnv: process.env.NODE_ENV,
    port: SERVER_PORT,
    mongoUri,
    mongoDbName: process.env.MONGO_DB,
    redisUrl: process.env.REDIS_URL,
    redisTlsUrl: process.env.REDIS_TLS_URL,
    redisCacheTtlInMins: process.env.CACHE_TTL_IN_MINS,
  }

  const welcomeMessage = `Running covid-api GQL server at http://localhost:${SERVER_PORT}/graphql in env: ${process.env.NODE_ENV}`
  logger.info(welcomeMessage)
  logger.info('Envs:', envs)
}

startServer()
