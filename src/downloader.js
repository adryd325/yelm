const log = require('npmlog')
const snekfetch = require('snekfetch')
const fs = require('fs')
const {promisify} = require('util')

module.exports = {
  save: downloadFile,
  get: downloadData
}
async function downloadFile (url, dest, shush = false) {
  if (!shush) {
    log.http('downloader', '%s -> %s', url, dest)
  } else {
    log.silly('downloader', '%s -> %s', url, dest)
  }

  try {
    let resp = await snekfetch.get(url)
    if (resp.text == null) {
      resp.text = ''
    }
    await promisify(fs.writeFile)(dest, resp.text)
    return null
  } catch (e) {
    if (e.status !== 404) {
      log.error('downloader', e)
    } else {
      log.error('downloader', '404: %s', url)
    }
    return null
  }
}
async function downloadData (url, shush = false) {
  if (!shush) {
    log.http('downloader', '%s', url)
  } else {
    log.silly('downloader', '%s', url)
  }
  try {
    let resp = await snekfetch.get(url)
    if (resp.text == null) {
      resp.text = ''
    }
    return resp.text
  } catch (e) {
    if (e.status !== 404) {
      log.error('downloader', e)
    } else {
      log.error('downloader', '404: %s', url)
    }
    return null
  }
}
