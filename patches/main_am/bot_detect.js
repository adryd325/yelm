module.exports = function (performPatch, data) {
  performPatch({
    name: 'Bot detection',
    type: 'simpleReplace',
    replace: {
      from: /p\.default\.Store\.pauseEmittingChanges\(\), t\.user\.bot/g,
      to: 'false'
    }
  })
}
