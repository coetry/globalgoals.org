const view = require('../view')
const { __ } = require('../../locale')

exports['404'] = require('./404')
exports['500'] = require('./500')
exports['503'] = require('./503')

exports.create = function createError (status) {
  return view(error, title)

  function error (state) {
    return exports[status.toString()](state.error)
  }

  function title (status) {
    switch (status) {
      case 404: return __('Not found')
      case 500: return __('An error occured')
      case 503: return __('You\'re offline')
      default: return null
    }
  }
}
