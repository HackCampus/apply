// TODO: children as array (polymorphic map)
const { pull } = require('inu');
const mapValues = require('lodash.mapvalues');
const pullMany = require('pull-many');
const u = require('updeep');
const extend = require('xtend');

// features:
// child components
// call child component from view function with dispatch, update, etc. wired up
// handle effects at any level
// run multiple effects at once
module.exports = function Component(component) {
  const none = {};

  // Should be used as return value from a `run` function.
  // The actual replacing of children only happens in the `update` function,
  // so we need to ensure that some action triggers this.
  // `action` needs to be passed by child components so that the right update function gets called.
  component.replaceChild = function (childName, newChild, action = (type, payload) => ({ type, payload })) {
    component.newChildren = component.newChildren || [];
    component.newChildren.push({ name: childName, component: newChild });
    return pull.once(action('@@replaceChild', childName));
  };

  const self = {
    children: component.children || none,

    init() {
      const init = typeof component.init === 'function' ? component.init : () => ({ model: null, effect: null });

      const topLevelInit = init();
      if (self.children === none) {
        return topLevelInit;
      }

      const childInits = mapValues(self.children, child => child.init());

      const childModels = mapValues(childInits, child => child.model);
      const model = Object.assign({}, topLevelInit.model, { children: childModels });

      const topLevelEffect = topLevelInit.effect;
      let effects = Array.isArray(topLevelEffect) ? topLevelEffect : [topLevelEffect];
      for (let child in childInits) {
        const childEffect = childInits[child].effect;
        if (childEffect) {
          effects.push({ child, effect: childEffect });
        }
      }
      const actualEffects = effects.filter(effect => !!effect);
      const maybeEffects = actualEffects.length > 0 ? actualEffects : null;

      return { model, effect: maybeEffects };
    },

    update(model, action) {
      if (component.newChildren != null && component.newChildren.length > 0) {
        const oldChildren = model.children;
        const newChildren = {};
        for (let child in oldChildren) {
          newChildren[child] = oldChildren[child];
        }
        component.newChildren.forEach(({ name, component: childComponent }) => {
          self.children[name] = childComponent;
          const { model: childModel } = childComponent.init();
          newChildren[name] = childModel;
        });
        model = Object.assign({}, model, { children: newChildren });
        component.newChildren = null;
      }
      if (action && action.child && action.child in self.children && model.children) {
        const { child, action: childAction } = action;
        const { model: childModel, effect: childEffect } = self.children[child].update(model.children[child], childAction);
        const newModel = u.updateIn(['children', child], childModel, model);
        const maybeChildEffect = childEffect ? { child, effect: childEffect } : null;
        return { model: newModel, effect: maybeChildEffect };
      }
      return component.update(model, action);
    },

    view(model, dispatch) {
      if (self.children === none) {
        return component.view(model, dispatch);
      }
      const children = mapValues(self.children, (childComponent, child) => function childView(overrides) {
        if (!(child in model.children)) {
          throw new Error(`internal error: child ${child} not in model.`);
        }
        const childModel = typeof overrides === 'object' ? extend(model.children[child], overrides) : model.children[child];
        return childComponent.view(childModel, function childDispatch(action) {
          dispatch({ child, action });
        });
      });
      return component.view(model, dispatch, children);
    },

    // If the child does not have a run function, we pass the whole effect object, keyed by child, to the parent component's run function.
    // Allows us to handle effects at a higher level, (hopefully) making child components more reusable.
    handlesEffects: typeof component.run === 'function',

    run(effect, sources, action = (type, payload) => ({ type, payload })) {
      if (Array.isArray(effect)) {
        const runEffects = effect.map(singleEffect => self._runOne(singleEffect, sources, action));
        const effectActionSources = runEffects.filter(e => !!e);
        return pullMany(effectActionSources);
      } else {
        return self._runOne(effect, sources, action);
      }
    },
    _runOne(effect, sources, action) {
      const child = effect.child;
      if (child && self.children[child]) {
        const childComponent = self.children[child];
        const run = self.children[child];
        if (effect.effect == null) {
          return null;
        }
        if (childComponent.handlesEffects) {
          return childComponent.run(effect.effect, sources, (type, payload) => ({ child, action: action(type, payload) }));
        }
      }
      if (typeof component.run === 'function') {
        return component.run(effect, sources, action);
      } else {
        console.error('no run function defined for effect', effect);
        return null;
      }
    }
  };
  return Object.assign({}, component, self);
};