const transformer = require(`@takeamos/transformer`)
const Storage = require(`./storage`)
const fetch = require(`node-fetch`)
const debug = require(`debug`)(`amos:consumer`)

const checkForHydration = async (entity, serviceConfig) => {
  const {
    url,
    name,
    authentication
  } = serviceConfig

  const hydrate = async (id) => {
    const hydratedRes = await fetch(`${url}/api/hydrate?id=${id}`, {
      headers: {
        [`Authorization`]: `API ${authentication}`,
      }
    })

   return hydratedRes.json()
  }

  if (entity.truncated) {
    const hydratedTopLevel = await hydrate(entity.id_str)

    entity = Object.assign(entity, hydratedTopLevel)
  }

  // TODO Hydrate backstory

  return entity
}

class Consumer {
  constructor(storage, serviceConfigs) {
    debug(`creating new instance of Consumer`)

    this.serviceConfigs = serviceConfigs

    this.storage = storage
  }

  async start(service) {
    debug(`starting ${service || `all services`}`)

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
            latestId,
          } = serviceConfig

          debug(`fetching ${name} data`)
          const pulledRes = await fetch(`${url}/api/pull?latest=${latestId}`, {
            headers: {
              [`Authorization`]: `API ${authentication}`,
            }
          })

          let { entities } = await pulledRes.json()

          // TODO Write to meta file
          serviceConfig.latestId = entities[0].id_str

          entities = entities.map((entity) => {
            return transformer(entity, name)
          })

          await this.storage.write(name, entities, fsConfig)
        }
      })(service, serviceConfig), serviceConfig.pullInterval);
    }

    if (!service) {
      return this.serviceConfigs.map(startService)
    }

    const serviceConfig = this.serviceConfigs.find(({ name }) => name === service)

    if (!serviceConfig) {
      throw new Error(`Could not find ${service} as a configured service.`)
    }

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
  Consumer,
  Storage,
}
