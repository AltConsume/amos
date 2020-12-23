const asyncIteratorToStream = require(`async-iterator-to-stream`)
const express = require(`express`)

const { PORT } = process.env

const createServer = (storage) => {
  const app = express()

  app.get(`/:service/feed/:id`, async (req, res, next) => {
    const { service, id } = req.params

    const entity = await storage.read(service, { id })

    return res.json(entity)
  })

  app.get(`/:service/feed`, async (req, res, next) => {
    const { service } = req.params

    const feed = await storage.feed(service)

    return res.json({ feed })
  })


  const port = PORT || 3001
  console.log(`Started server on ${port}`)
  app.listen(port)
}

module.exports = { createServer }
