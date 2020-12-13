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

    return promisify(fs.readFile)(`${this.dir}/${ref}/${id}`)
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
      console.debug(`writing ${baseDir}/${record.about.identifier}`)

      return promisify(fs.writeFile)(`${baseDir}/${record.about.identifier}`, JSON.stringify(record), { flag: `wx+` })
    })

    return Promise.allSettled(promises)
  }

  async feed(ref, skip) {
    const files = await promisify(fs.readdir)(`${this.dir}/${ref}`)

    files[Symbol.asyncIterator] = async function*() {
      for(let i = 0; i < files.length; i++) {
        const filePath = files[i]
        const fileContents = await promisify(fs.readFile)(filePath)

        yield {
          value: fileContents,
          done: false
        }
      }

      yield { done: true }
    }
  }
}

module.exports = FsStorage

