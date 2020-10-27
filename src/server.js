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
    .listen(SERVER_PORT)

  const welcomeMessage = `Running covid-api GQL server at http://localhost:${SERVER_PORT}/graphql in env: ${process.env.NODE_ENV}`
  console.log(welcomeMessage)
  logger.info(welcomeMessage)
}

startServer()
