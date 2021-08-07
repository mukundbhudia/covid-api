# covid-api
GraphQuery API that serves Johns Hopkins CSSE data on covid-19. Uses Node, express, graphQL, mongoDB.
This project works in conjunction with [covid-web](https://github.com/mukundbhudia/covid-api) and [covid-service](https://github.com/mukundbhudia/covid-service).

## Demo

A working demo of his API is avaiable at https://covid19-dash-api2.herokuapp.com/. Use the [GraphiQL web interface](https://covid19-dash-api2.herokuapp.com/graphql) to explore the data structure and perform queries.

## Prerequisites
* Node v14.x.x
* NPM v6.x.x
* mongoDB v3.6.x (running with URI: `'mongodb://localhost:27017'`)
* If running in dev mode, a `.env` file in the project directory is needed with the key=val of `NODE_ENV=development` set.
* covid-api needs [covid-service](https://github.com/mukundbhudia/covid-service) to have run at least once.

## Available Scripts

In the project directory, you can run:

### `npm run nm`

Runs the server in the development mode using nodemon.<br />
Open [http://localhost:4000](http://localhost:4000) to view it in the browser.

The project will reload if you make edits to the source code.<br />

### `npm start`

Runs the server in production mode from project directory .<br />
Open [http://localhost:4000](http://localhost:4000) to view it in the browser.

## Thanks

* To [Johns Hopkins CSSE](https://github.com/CSSEGISandData/COVID-19) for the hard work providing and collating the data.
* To [Salomão Rodrigues](https://github.com/salomao-rodrigues) for helping me to start up the project.
