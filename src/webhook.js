const log = require('npmlog')
const snekfetch = require('snekfetch')
class Webhook {
  constructor (config) {
    this.config = config
  }

  async post (release) {
    for (const hook of this.config.webhooks) {
      for (const releaseChannel of hook.channels) {
        if (releaseChannel === release.env) {
          if (hook.meme) {
            this.postWebhook(hook.id, hook.token, release.build.split('').join(' '))
          } else {
            let color = 0x7289da
            if (releaseChannel === 'canary') {
              color = 0xfaa61a
            }
            let description = `\`main = ${release.primary}\`\n\`splitting = ${release.secondary}\`\n\`css = ${release.css}\`\n`
            this.postWebhook(hook.id, hook.token, '', {
              title: `${releaseChannel} build ${release.build}`,
              description: description,
              timestamp: release.firstSeen,
              color: color
            })
          }
        }
      }
    }
  }
  async postWebhook (id, token, message, embed) {
    try {
      let embeds = null
      if (embed) {
        embeds = [embed]
      }

      await snekfetch
        .post(`https://canary.discordapp.com/api/webhooks/${id}/${token}`)
        .send({content: message, embeds: embeds, username: 'ReleaseRacer'})
    } catch (e) {
      // console.log(e)
    }
  }
}

module.exports = Webhook
