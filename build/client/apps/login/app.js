const { pull, html } = require('inu');

const action = require('../../lib/action');
const Component = require('../../lib/component');

const login = require('../../components/login');

module.exports = Component({
  children: {
    login
  },
  init() {
    return {
      model: {},
      effect: action('waitForAuthorization')
    };
  },
  update(model, a) {
    switch (a.type) {
      case 'authorized':
        return { model, effect: action('redirect') };
      case 'unauthorized':
        console.error('not authorized');
        return { model, effect: null };
      default:
        return { model, effect: null };
    }
  },
  view(model, dispatch, children) {
    return html`
      <div class="login">
        ${children.login()}
      </div>
    `;
  },
  run(effect, sources, action) {
    switch (effect.type) {
      case 'waitForAuthorization':
        {
          return pull(sources.models(), pull.map(model => model.children.login.user), pull.filter(user => user != null), pull.take(1), pull.map(user => {
            if (user.role === 'matcher') {
              return action('authorized');
            } else {
              return action('unauthorized');
            }
          }));
        }
      case 'redirect':
        {
          window.location.reload();
        }
    }
  }
});