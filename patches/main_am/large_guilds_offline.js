module.exports = function (performPatch, data) {
  performPatch({
    name: 'Large guild threshold at 1000',
    type: 'simpleReplace',
    replace: {
      from: 't.LARGE_THRESHOLD = 100',
      to: 't.LARGE_THRESHOLD = 1000'
    }
  })
}
