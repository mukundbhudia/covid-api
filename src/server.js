const express = require('express')
const { graphqlHTTP } = require('express-graphql')
const cors = require('cors')
const { connectDB } = require('./modules/dbClient')
const { schema } = require('./modules/schema')
const { root } = require('./modules/resolvers')

require('dotenv').config()

const PORT = process.env.PORT || 4000

const app = express()

const startServer = async () => {
  await connectDB()
  app.use(cors())
    .use('/graphql', graphqlHTTP({
      schema: schema,
      rootValue: root,
      graphiql: true,
    }))
    .listen(PORT)

  console.log(`Running a GraphQL API server at http://localhost:${PORT}/graphql`)
}

startServer()
