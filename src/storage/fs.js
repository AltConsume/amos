const { promisify } = require(`util`)
const fs = require(`fs`)

class FsStorage {
  constructor(baseDir) {
    try {
      // Make sure the base directory is created
      fs.mkdirSync(baseDir)
    } catch (e) {
      console.log('dir already created')
    }

    this.dir = baseDir
  }

  async read(ref, opts) {
    const { id } = opts

    const file = await promisify(fs.readFile)(`${this.dir}/${ref}/${id}`)

    return JSON.parse(file.toString())
  }

  async write(ref, records, opts) {
    let _records = records

    if (!Array.isArray(_records)) {
      records = [ records ]
    }

    const baseDir = `${this.dir}/${ref}`

    try {
      await promisify(fs.mkdir)(baseDir)
    } catch (e) {
      console.log(`dir already exists`)
    }

    const promises = records.map((record) => {

      const path = `${baseDir}/${record.about.identifier}`;
      return promisify(fs.writeFile)(path, JSON.stringify(record), { flag: `wx+` })
        .then(() => {
          console.debug(`wrote ${path}`)
        })
        .catch((e) => {
          console.debug(`failed writing ${path} due to ${e.message}`)
        })
    })

    return Promise.allSettled(promises)
  }

  async feed(ref, skip) {
    const dirPath = `${this.dir}/${ref}`

    let files = await promisify(fs.readdir)(dirPath)

    files = files.slice(0, 100)

    const entities = []
    for(let i = 0; i < files.length; i++) {
      const filePath = files[i]
      const fileContents = await promisify(fs.readFile)(`${dirPath}/${filePath}`)

      entities.push(JSON.parse(fileContents.toString()))
    }

    return entities
  }
}

module.exports = FsStorage

