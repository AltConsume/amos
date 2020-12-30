const { promisify } = require(`util`)
const { resolve } = require(`path`)
const debug = require(`debug`)(`amos:index`)
const fs = require(`fs`)

const {
  Amos,
  Storage,
} = require(`./src`)

;(async () => {
  let amos

  const configPath = resolve(__dirname, `config.json`)

  debug(`using ${configPath} as config`)

  try {
    let config = await promisify(fs.readFile)(configPath)
    config = JSON.parse(config.toString())

    debug(`read config.json`)

    const {
      serviceConfigs,
      storage,
    } = config

    debug(`instantiating fs storage at ${storage.path}`)

    // TODO Allow for config to adjust what storage used
    const storageInstance = new Storage.FS(storage.path)

    amos = new Amos(storageInstance, serviceConfigs)

    debug(`starting all amos polls`)

    amos.start()
  } catch (error) {
    console.error(`Error occurred: `, error)

    return process.exit(1)
  }

  process.on(`SIGINT`, () => {
    debug(`trying a clean exit of amos`)

    amos.stop()

    process.exit(0)
  })
})()

