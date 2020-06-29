module.exports = function (performPatch, data) {
  performPatch({
    name: 'isDeveloper true',
    type: 'simpleReplace',
    replace: {
      from: 'e && (e.flags & c.UserFlags.STAFF) === c.UserFlags.STAFF && (d = !0)',
      to: 'd = !0'
    }
  })
}
