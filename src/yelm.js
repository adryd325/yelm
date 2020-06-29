/*
 * Yelm
 * A Discord client datamining utility
 * Written by [redacted] and Adryd
 */

// Import libraries
const argv = require('minimist')(process.argv.slice(2))
const log = require('npmlog')
const {promisify} = require('util')
const path = require('path')
const fs = require('fs')
log.level = 'verbose'
// Configure npmlog.
if (argv.v || argv.verbose) {
  log.level = 'silly'
}

log.addLevel('patch', 2250, {
  fg: 'yellow',
  bg: 'black'
})
log.disableUnicode()
log.enableProgress()

// Import config
let config = {
  patchFor: 'canary',
  watchFor: [
    'canary', 'ptb', 'stable'
  ],
  host: 'discordapp.com',
  pollingRate: 15 * 1000,
  lastReleaseFile: './data/lastRelease'
}
try {
  let configFile = require('../config.json')
  for (var property of Object.keys(configFile)) {
    config[property] = configFile[property]
  }
} catch (e) {
  log.verbose('yelm', 'No config file was found, using default config')
}

// Import functions
const Scraper = require('./scraper.js')
const Patcher = require('./patcher.js')
const Webhook = require('./webhook.js')

async function yelm (params) {
  let scraper = new Scraper(config)
  let patcher = new Patcher(config)
  let webhook = new Webhook(config)

  log.verbose('yelm', 'Getting current build')
  scraper.getBuilds(config.watchFor, true) // Do initial build download so the patcher will patch immediately after starting

  log.verbose('yelm', 'Started watcher')
  scraper.watchFor(config.watchFor) // Watch for new builds.

  scraper.on('build', async(build) => {
    if (build.env === config.patchFor) { // only patch if it's the release channel is that specified in the config
      log.verbose('yelm', 'Received build details. Beginning patch procedure.')
      patcher.patch(build) // Send build details to patch function.
    }
  })

  scraper.on('newBuild', async(build) => {
    webhook.post(build) // Send new build details to webhook function.
  })
}

yelm()
