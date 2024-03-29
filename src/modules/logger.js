const winston = require('winston')

let loggingLevel = process.env.LOG_LEVEL || 'info'

const initLogger = () => {
  const logger = winston.createLogger({
    level: loggingLevel,
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
      }),
      // winston.format.errors({ stack: true }),
      // winston.format.splat(),
      winston.format.json()
    ),
    // defaultMeta: { service: 'covid-api' },
    transports: [
      //
      // - Write all logs with level `error` and below to `error.log`
      // - Write all logs with level `info` and below to `combined.log`
      //
      new winston.transports.File({
        filename: './logs/error.log',
        level: 'error',
      }),
      new winston.transports.File({ filename: './logs/combined.log' }),
    ],
  })

  //
  // If we're not in production then log to the `console` with the format:
  // `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
  //
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  )

  return logger
}

const logger = initLogger()

module.exports = {
  logger,
}
