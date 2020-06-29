module.exports = function (performPatch, data) {
  performPatch({
    name: 'Overlay Always Enabled OSX',
    type: 'simpleReplace',
    replace: {
      from: 'return Te.default.isSupported()',
      to: 'return true'
    }
  })
}
