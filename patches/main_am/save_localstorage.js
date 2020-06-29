module.exports = function (performPatch, data) {
  performPatch({
    name: 'Save localstorage',
    type: 'simpleReplace',
    replace: {
      from: 'delete window.localStorage',
      to: ''
    }
  })
}
