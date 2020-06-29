const log = require('npmlog')
const {promisify} = require('util')
const path = require('path')
const fs = require('fs')
const beautify = require('js-beautify').js_beautify
const download = require('./downloader.js')
const fileReg = /([0-9]+): ?"([a-f0-9]+)"/g
const fileRegS = /([0-9]+): ?"([a-f0-9]+)"/
class Patcher {
  constructor (config) {
    this.config = config
  }

  async patch (release) {
    const displayFiles = {
      'CSS file': release.css,
      'primary JS': release.primary,
      'vendor JS': release.secondary
    }

    for (const [display,
      assetPath] of Object.entries(displayFiles)) {
      log.info('patcher', 'Found %s file: %s', display, assetPath)
    }

    let data = await download.get('https://' + release.host + release.primary)
    let secondary = await download.get('https://' + release.host + release.secondary)

    log.info('patcher', 'Preparing to merge split files.')
    data += await this.merge(secondary, release)

    const performPatch = (pch) => {
      log.patch('patcher', 'Patch: %s (type: %s)', pch.name, pch.type)

      let newData = data

      switch (pch.type) {
        case 'simpleReplace':
          newData = newData.replace(pch.replace.from, pch.replace.to)
          break
        case 'multiReplace':
          for (let [from_,
            to] of pch.replaces) {
            newData = newData.replace(from_, to)
          }
          break
        case 'dynamic':
          newData = pch.operate()
          break
      }
      data = newData
    }

    // Read all BM (before minification) patches.
    fs
      .readdirSync('./patches/main_bm')
      .forEach(file => {
        if (file.endsWith('.js')) {
          require('../patches/main_bm/' + file)(performPatch, data)
        }
      })

    log.info('patcher', 'Beautifying the primary JS file. This can take a second.')

    // Beautify.
    data = beautify(data, {indent_size: 2})

    // Apply all AM (after minification) patches.
    fs
      .readdirSync('patches/main_am')
      .forEach(file => {
        if (file.endsWith('.js')) {
          require('../patches/main_am/' + file)(performPatch, data)
        }
      })

    log.info('patcher', 'Writing patched primary JS file.')

    // Write!
    await promisify(fs.writeFile)(path.join(__dirname, '..', release.primary), data)

    const indexPath = '/channels/@me/index.html'
    let html = await promisify(fs.readFile)(path.join(__dirname, '..', indexPath), 'utf8')

    // Patch the stylesheet file.
    let cssReg = /(<link rel="stylesheet" href=").+(">)/i.exec(html)
    html = html.replace(cssReg[0], cssReg[1] + release.css + cssReg[2])

    // Patch the JavaScript files.
    let jsReg = /(<script src=").+("><\/script>)(<script src=").+("><\/script>)/i.exec(html)
    html = html.replace(jsReg[0], jsReg[1] + release.secondary + jsReg[2] + jsReg[3] + release.primary + jsReg[4])

    log.info('yelm', 'Writing HTML.')

    await promisify(fs.writeFile)(path.join(__dirname, '..', indexPath), html)
  }

  async merge (data, release) {
    let final = ''
    let matched = data.match(fileReg)
    for (const i in matched) {
      let match = fileRegS.exec(matched[i])
      let asset = `/assets/${match[1]}.${match[2]}.js`
      log.silly('split', 'Found %s', asset)
      final += '\n' + await download.get('https://' + release.host + asset, true)
    }
    return final
  }
}

module.exports = Patcher
