const { createServer } = require(`./server`)
const { parse } = require(`@takeamos/models`)
const Storage = require(`./storage`)
const fetch = require(`node-fetch`)
const debug = require(`debug`)(`amos:src:index`)

const $findServiceConfig = Symbol(`findServiceConfig`)

class Amos {
  constructor(storage, serviceConfigs) {
    debug(`creating new instance of Amos`)

    this.serviceConfigs = serviceConfigs

    this.storage = storage

    // Server for feeds and recommendations
    this.server = createServer(storage)
  }

  start(service) {
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
          } = serviceConfig

          let {
            latestId
          } = serviceConfig

          if (latestId === undefined) {
            // Load from meta file
            try {
              const meta = await this.storage.read(name, `meta`)

              if (meta) {
                const latestIdEntry = meta.values.find(({ key }) => key === `latestId`)

                latestId = latestIdEntry.value
              }
            } catch (error) {
              debug(`failed to read from meta file due: `, error)
            }
          }

          debug(`fetching ${name} data for scope ${scope} for latestId=${latestId}`)
          const pulledRes = await fetch(`${url}/api/pull?latestId=${latestId}&scope=${scope}`, {
            headers: {
              [`Authorization`]: `API ${authentication}`,
            }
          })

          if (pulledRes.status !== 200) {
            try {
              const error = await pulledRes.text()

              console.error(`Failed to fetch ${name} data for scope ${scope}: ${error}`)

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

          serviceConfig.latestId = entities[0].id

          debug(`latest id for ${name} for scope ${scope}: ${serviceConfig.latestId}`)

          debug(`writing ${entities.length} entities for ${name} for scope ${scope}`)

          // Store scopes in different folders
          let _name = scope ? `${name}/${scope}` : name

          await this.storage.write(_name, entities, fsConfig)

          // Save latestId to a meta file for this service
          const serviceMeta = {
            about: {
              identifier: `meta`,
            },
            values: [
              {
                key: `latestId`,
                value: serviceConfig.latestId,
              },
            ],
          }

          await this.storage.write(name, serviceMeta, fsConfig)

        }
      })(service, serviceConfig), serviceConfig.pullSeconds * 1000);
    }

    if (!service) {
      debug(`trying to start all services present in serviceConfigs (${this.serviceConfigs.length} services definitions found)`)

      return this.serviceConfigs.map(startService)
    }

    debug(`trying to start ${service} service`)
    const serviceConfig = this[$findServiceConfig](service)

    return startService(serviceConfig)
  }

  stop(service) {
    debug(`stopping ${service || `all services`}`)

    const stopService = (serviceConfig) => {
      const poll = serviceConfig.loop

      clearInterval(poll)
    }

    if (!service) {
      return this.serviceConfigs.map(stopService)
    }

    debug(`trying to stop ${service} service`)
    const serviceConfig = this[$findServiceConfig](service)

    return stopService(serviceConfig)
  }

  [$findServiceConfig](serviceName) {
    const serviceConfig = this.serviceConfigs.find(({ name }) => name === serviceName)

    if (!serviceConfig) {
      throw new Error(`Could not find ${serviceName} as a configured service.`)
    }

    debug(`found service config for ${serviceName}`)

    return serviceConfig
  }
}

module.exports = {
  Amos,
  Storage,
}
