module.exports = function (performPatch, data) {
  performPatch({
    name: 'Call ringing beat preview',
    type: 'simpleReplace',
    replace: {
      from: 'sound: "call_ringing"',
      to: 'sound: "call_ringing_beat"'
    }
  })
}
