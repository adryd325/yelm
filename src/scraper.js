const { EventEmitter } = require('events')
const log = require('npmlog')
const {promisify} = require('util')
const path = require('path')
const fs = require('fs')

const download = require('./downloader.js')

const filesRegex = {
  css: /<link rel="stylesheet" href="(.+)" integrity="(?:.+)">/i,
  js: /<script src="(.+)" integrity="(?:.+)"><\/script><script src="(.+)" integrity="(?:.+)"><\/script>(?:<script src="(.+)" integrity="(?:.+)"><\/script>)?/i
}

class Scraper extends EventEmitter {
  constructor (config) {
    super()
    this.config = config
  }

  async watchFor (channels) {
    setInterval(async () => {
      this.getBuilds(channels)
    }, this.config.pollingRate)
  }

  async getBuilds (channels, f = false) {
    log.silly('scraper', 'Reading lastRelease')
    let lastRelease = JSON.parse(await promisify(fs.readFile)(path.join(__dirname, '../' + this.config.lastReleaseFile), 'utf8')) // Read lastRelease file
    let thisRelease = lastRelease // Duplicate variable
    for (const channel of channels) {
      log.verbose('scraper', 'Polling %s for new build', channel)
      thisRelease[channel] = await this.getBuild(channel, lastRelease[channel], f) // Each build will be checked
    }
    log.silly('scraper', 'Writing lastRelease')
    await promisify(fs.writeFile)(path.join(__dirname, '../' + this.config.lastReleaseFile), JSON.stringify(thisRelease)) // Update lastRelease File
  }

  async getBuild (channel, lastRelease, f) {
    let host = await this.getHost(channel)
    let fileNames = await this.getFileNames(host)
    if (lastRelease && lastRelease.primary === fileNames.primary && !f) { // Check if no changes are made to the file hash
      let thisRelease = lastRelease
      thisRelease.lastSeen = new Date().toISOString()
      log.verbose('scraper', 'Found no changes to %s', channel)
      this.emit('sameBuild', thisRelease)
      return thisRelease
    } else {
      log.silly('scraper', 'Reading lastRelease')
      let lastRelease = JSON.parse(await promisify(fs.readFile)(path.join(__dirname, '../' + this.config.lastReleaseFile), 'utf8'))[channel]
      let fileData = await download.get('http://' + host + fileNames.primary) // Download primary JS file
      let build = /environment:".+",release:"(.+)",ignoreErrors/g.exec(fileData) // Build Regex
      let currentTime = new Date() // Get current time
      let firstSeen = currentTime.toISOString()
      let release = {
        build: build[1],
        primary: fileNames.primary,
        secondary: fileNames.secondary,
        css: fileNames.css,
        firstSeen: firstSeen,
        lastSeen: currentTime.toISOString(),
        env: channel,
        host: host
      }

      if (lastRelease.primary === fileNames.primary) {
        log.info('scraper', 'Found %s build. (%s)', channel, build[1])
        this.emit('build', release)
        this.emit('sameBuild', release)
      } else if (lastRelease && lastRelease.primary !== fileNames.primary) {
        log.info('scraper', 'Found new %s build. (%s)', channel, build[1])
        this.emit('newBuild', release)
      }

      return release
    }
  }
  async getHost (channel) {
    let host = ''
    if (channel === 'stable') {
      host = this.config.host
    } else {
      host = `${channel}.${this.config.host}`
    }
    return host
  }

  async getFileNames (host) {
    log.verbose('scraper', 'Scraping client file hashes of %s', host)
    let resp = await download.get('http://' + host + '/channels/@me', true)
    if (resp === null) {
      throw new Error(`Failed to fetch version data from ${host}! (HTTP ${resp.statusText})`)
    }

    const cssFile = filesRegex.css.exec(resp)
    const jsFiles = filesRegex.js.exec(resp)

    if (!cssFile[1] && !jsFiles[1] && !jsFiles[2]) {
      throw new Error('Couldn\'t fetch one of the files.')
    }

    log.verbose('scraper', 'Got tags: css:%s, js:%s', cssFile, jsFiles)

    return {
      css: cssFile[1],
      primary: jsFiles[2],
      secondary: jsFiles[1]
    }
  }
}

module.exports = Scraper
