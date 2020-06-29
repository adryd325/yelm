module.exports = function (performPatch, data) {
  performPatch({
    name: 'All snowflakes behave the same',
    type: 'multiReplace',
    replaces: [
      [/t\.type === i\.ChannelTypes\.GUILD_TEXT && p\.default\.can\(i.Permissions.VIEW_CHANNEL, n, t\)/g, 'true'],
      [/"#deleted-channel"/g, '"<#" + e[1] + ">"'],
      [/guildId: null != t \? t\.guild_id : null,/, 'guildId: null != t.guild_id ? t.guild_id : "@me",']
    ]
  })
}
