module.exports = function (performPatch, data) {
  performPatch({
    name: 'Call ringing beat',
    type: 'simpleReplace',
    replace: {
      from: '"call_ringing" : "call_ringing"',
      to: '"call_ringing" : "call_ringing_beat"'
    }
  })
}
