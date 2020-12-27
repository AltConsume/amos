const { promisify } = require(`util`)
const express = require(`express`)
const redis = require(`redis`)

const {
  PORT,
  REDIS_URL,
} = process.env

const redisClient = redis.createClient(REDIS_URL)

const hgetAsync = promisify(redisClient.hget).bind(redisClient)

const createServer = (storage) => {
  const app = express()

  app.get(`/api/:service/feed/:id`, async (req, res, next) => {
    const { service, id } = req.params

    const entity = await storage.read(service, { id })

    return res.json(entity)
  })

  app.get(`/api/:service/feed`, async (req, res, next) => {
    const { service } = req.params

    const stringifiedIdentifiers = await hgetAsync(`recommendations`, service)

    const parsedIdentifiers = JSON.parse(stringifiedIdentifiers)

    const entities = await storage.feed(service, parsedIdentifiers)

    return res.json(entities)
  })


  const port = PORT || 3001

  console.log(`Started server on ${port}`)

  app.listen(port)
}

module.exports = { createServer }
