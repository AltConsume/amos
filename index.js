const { promisify } = require(`util`)
const { resolve } = require(`path`)
const fs = require(`fs`)

const {
  Deck,
  Storage,
} = require(`../src`)

;(async () => {
  const configPath = resolve(__dirname, `config.json`)

  let config = await promisify(fs.readFile)(configPath)
  config = JSON.parse(config.toString())

  const {
    serviceConfigs,
    storage,
  } = config

  // TODO Allow for config to adjust what storage used
  const storage = new Storage.FS(storage.path)

  const consumer = new Deck(storage, serviceConfigs)

  consumer.start()
})()

