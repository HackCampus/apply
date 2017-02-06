#!/usr/bin/env bash

if [ "$#" -ne 1 ]; then
  echo "usage: ./scripts/createApp.sh appName"
  exit
fi

if [ ! -e "package.json" ]; then
  echo "this script must be run from the project root."
  exit
fi

AppName=$1
AppRoot="app/client/apps/$1"

mkdir $AppRoot

pushd $AppRoot

cat > app.js <<EOF
const {pull, html} = require('inu')
const u = require('updeep')

const action = require('../../lib/action')
// const api = require('../../lib/api')
const Component = require('../../lib/component')

// const someComponent = require('../../components/someComponent')

module.exports = Component({
  children: {
    // TODO add children...
  },
  init () {
    return {
      model: {},
      effect: null,
    }
  },
  update (model, action) {
    switch (action.type) {
      // case 'changeMe': {
      //   const newModel = u({changeMe: 'please'}, model)
      //   return {model: newModel, effect: null}
      // }
      default:
        return {model, effect: null}
    }
  },
  view (model, dispatch, children) {
    return html\`
      <div class="$AppName">
        hello from $AppName :)
      </div>
    \`
  },
  // run (effect, sources, action) {
  //   const get = (url, handler) =>
  //     pull(api.get(url), pull.map(handler))
  //   switch (effect.type) {
  //     case 'foo': {
  //     }
  //   }
  // }
})
EOF

cat > index.js <<EOF
const {html, pull, start} = require('inu')
const log = require('inu-log')

const app = require('./app')

function main () {
  const {views} = start(app)

  const container = document.getElementById('container')
  const appDiv = container.appendChild(document.createElement('div'))
  pull(
    views(),
    pull.drain(view => {
      html.update(appDiv, view)
    })
  )

  // pull(
  //   actions(),
  //   pull.log()
  // )

  // pull(
  //   models(),
  //   pull.log()
  // )
}
document.addEventListener('DOMContentLoaded', main)
EOF

cat > styles.css <<EOF
.$AppName {
  /* TODO add styles */
}
EOF

mkdir __tests__

cat > __tests__/test.js <<EOF
const test = require('ava')
const sinon = require('sinon')

const app = require('../app')

test('init', t => {
  t.snapshot(app.init())
})

test('view - initial', t => {
  const {model} = app.init()
  const dispatch = sinon.stub()
  const view = app.view(model, dispatch)
  t.snapshot(view.toString())
  t.false(dispatch.called)
})
EOF

popd
