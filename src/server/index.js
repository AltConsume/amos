const { promisify } = require(`util`)
const express = require(`express`)
const debug = require(`debug`)(`amos:server`)
const redis = require(`redis`)

const {
  PORT,
  REDIS_URL,
} = process.env

const redisClient = redis.createClient(REDIS_URL)

const hgetAsync = promisify(redisClient.hget).bind(redisClient)

const createServer = (storage) => {
  debug(`creating amos server`)

  const app = express()

  app.get(`/api/:service/feed/:id`, async (req, res, next) => {
    const { service, id } = req.params

    try {
      debug(`request for single id ${id} for ${service}`)

      const entity = await storage.read(service, { id })

      debug(`returning entity ${id} for ${service}`)

      return res.json(entity)
    } catch (error) {
      console.error(`Error occurred while retrieving ${id} for ${service}: `, error)

      return res.status(500).json({ error: error.message })
    }
  })

  app.get(`/api/:service/feed`, async (req, res, next) => {
    const { service } = req.params

    try {
      debug(`looking up recommended feed for ${service}`)

      const stringifiedIdentifiers = await hgetAsync(`recommendations`, service)

      if (!stringifiedIdentifiers) {
        throw new Error(`Could not find recommended feed for ${service}`)
      }

      const parsedIdentifiers = JSON.parse(stringifiedIdentifiers)

      debug(`parsed recommendations for ${service}`)

      const entities = await storage.feed(service, parsedIdentifiers)

      debug(`retrieved ${entities.length} entities vs ${parsedIdentifers.length} recommendations for ${service} feed`)

      return res.json(entities)
    } catch (error) {
      console.error(`Error occurred while retrieving feed for ${service}: `, error)

      return res.status(500).json({ error: error.message })
    }
  })

  const port = PORT || 3001

  console.log(`Started server on ${port}`)

  app.listen(port)
}

module.exports = { createServer }
