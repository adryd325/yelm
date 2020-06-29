module.exports = function (performPatch, data) {
  performPatch({
    name: 'All guilds are partner guilds',
    type: 'simpleReplace',
    replace: {
      from: 'return this.features.has(e)',
      to: 'if (this.ownerId === "(your id)") {return !0} else {return this.features.has(e)}'
    }
  })
}
