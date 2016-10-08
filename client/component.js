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
      // Should be able to specify an array of effects (like Effect.batch in Elm)
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
    // If the child does not have a run function, pass the whole effect object, keyed by child.
    // Allows us to handle effects at a higher level, (hopefully) making child components more reusable.
    handlesEffects: typeof component.run === 'function',
    run (effect, sources) {
      const child = effect.child
      if (child && self.children[child]) {
        const childComponent = self.children[child]
        const run = self.children[child]
        if (childComponent.handlesEffects) {
          return childComponent.run(effect.effect, sources)
        }
      }
      if (typeof component.run === 'function') {
        return component.run(effect, sources)
      } else {
        console.error('no run function defined for effect', effect)
        return null
      }
    }
  }
  return self
}
