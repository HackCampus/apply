// TODO: children as array (polymorphic map)
const mapValues = require('lodash.mapvalues')
const u = require('updeep')

const none = {}

module.exports = function Component (component) {
  const self = {
    children: component.children || none,
    init () {
      const init = typeof component.init === 'function'
        ? component.init
        : () => ({model: null, effect: null})
      const componentInit = init()
      if (self.children === none) {
        return componentInit
      }
      const childInits = mapValues(self.children, child => child.init())
      const childModels = mapValues(childInits, child => child.model)
      const model = Object.assign({}, componentInit.model, {children: childModels})
      // TODO what to do with child effects?
      const effect = componentInit.effect
      return {model, effect}
    },
    update (model, action) {
      if (action.child && action.child in self.children && model.children) {
        const {child, action: childAction} = action
        const {model: childModel, effect: childEffect} = self.children[child].update(model.children[child], childAction)
        const newModel = u.updateIn(['children', child], childModel, model)
        const maybeChildEffect = childEffect ? {child, effect: childEffect} : null
        return {model: newModel, effect: maybeChildEffect}
      }
      return component.update(model, action)
    },
    view (model, dispatch) {
      if (self.children === none) {
        return component.view(model, dispatch)
      }
      const children = mapValues(self.children, ({view}, child) => (function () {
        return view(model.children && model.children[child], function (action) {
          dispatch({child, action})
        })
      }))
      return component.view(model, dispatch, children)
    },
    run () { throw new Error('TODO') }
  }
  return self
}
