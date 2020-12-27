const { createServer } = require(`./server`)
const { parse } = require(`@takeamos/models`)
const Storage = require(`./storage`)
const fetch = require(`node-fetch`)
const debug = require(`debug`)(`amos:deck`)

class Deck {
  constructor(storage, serviceConfigs) {
    debug(`creating new instance of Deck`)

    this.serviceConfigs = serviceConfigs

    this.storage = storage
    this.server = createServer(storage)
  }

  async start(service) {
    const startService = (serviceConfig) => {
      debug(`starting ${serviceConfig.name} service`)

      if (serviceConfig.loop) {
        return
      }

      serviceConfig.loop = setInterval(((service, serviceConfig) => {
        return async () => {
          const {
            fsConfig,
            url,
            authentication,
            name,
            scope,
            latestId,
          } = serviceConfig

          debug(`fetching ${name} data for scope ${scope}`)
          const pulledRes = await fetch(`${url}/api/pull?latestId=${latestId}&scope=${scope}`, {
            headers: {
              [`Authorization`]: `API ${authentication}`,
            }
          })

          if (pulledRes.status !== 200) {
            try {
              const error = await pulledRes.text()

              console.error(`Failed to fetch ${name} data for scope ${scope}: ${error || `no error found`}`)

              return
            } catch (error) {
              console.error(`Error while showing error for ${name} for scope ${scope}: ${error}`)

              return
            }
          }

          debug(`got a response back from ${name} for scope ${scope}`)

          let { entities } = await pulledRes.json()

          if (entities.length === 0) {
            console.warn(`Could not find entities for ${name} for scope ${scope}`)

            return
          }

          // TODO Write to meta file
          serviceConfig.latestId = entities[0].id

          debug(`latest id for ${name} for scope ${scope}: ${serviceConfig.latestId}`)

          entities = entities.map((entity) => {
            debug(`parsing ${entity.id} for ${name} for scope ${scope}`)

            return parse(entity, name)
          })

          debug(`writing ${entities.length} entities for ${name} for scope ${scope}`)

          let _name = scope ? `${name}/${scope}` : name

          await this.storage.write(_name, entities, fsConfig)
        }
      })(service, serviceConfig), serviceConfig.pullSeconds * 1000);
    }

    if (!service) {
      debug(`trying to start all services present in serviceConfigs (${this.serviceConfigs.length} services definitions found)`)

      return this.serviceConfigs.map(startService)
    }

    debug(`trying to start ${service} service`)

    const serviceConfig = this.serviceConfigs.find(({ name }) => name === service)

    if (!serviceConfig) {
      throw new Error(`Could not find ${service} as a configured service.`)
    }

    debug(`found service config for ${name}`)
    return startService(config)
  }

  stop(service) {
    debug(`stopping ${server || `all services`}`)

    if (!service) {
      // TODO Stop all
    }

    const serviceConfig = this.serviceConfigs[service]

    clearInterval(serviceConfig.loop)
    serviceConfig.loop = null
  }
}

module.exports = {
  Deck,
  Storage,
}
