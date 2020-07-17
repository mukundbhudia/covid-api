const express = require('express')
const { graphqlHTTP } = require('express-graphql')
const cors = require('cors')
const { schema } = require('./schema')
const { root } = require('./resolvers')

require('dotenv').config()

const PORT = process.env.PORT || 4000

const app = express()

const startServer = async () => {
  app.use(cors())
  app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
  }))
  app.listen(PORT)
  console.log(`Running a GraphQL API server at http://localhost:${PORT}/graphql`)
}

startServer()
