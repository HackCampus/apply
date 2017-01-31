const autoprefixer = require('autoprefixer')
const babelify = require('babelify')
const browserify = require('browserify')
const browserifyIncremental = require('browserify-incremental')
const {exec} = require('child_process')
const cssnano = require('cssnano')
const exorcist = require('exorcist')
const fs = require('fs')
const gulp = require('gulp')
const postcss = require('gulp-postcss')
const sourcemaps = require('gulp-sourcemaps')
const mkdirp = require('mkdirp')
const notifier = require('node-notifier')
const path = require('path')
const precss = require('precss')
const uglifyify = require('uglifyify')
const source = require('vinyl-source-stream')

const build = path.join(__dirname, 'app', 'build')
const client = path.join(__dirname, 'app', 'client')

const development = process.env.NODE_ENV !== 'production'

const babelifyConfig = {
  presets: ['es2015'],
}

if (development) {
  function bundle (entryPath) {
    return browserifyIncremental({
      entries: [entryPath],
      fullPaths: true, // for disc
      debug: true, // source maps
      cacheFile: path.join(build, '.buildCache.json')
    })
    .transform(babelify, babelifyConfig)
    .on('log', console.log)
    .bundle()
    .on('error', e => {
      notifier.notify({
        title: 'HackCampus',
        message: e.message,
      })
      throw e
    })
  }
} else { // production
  function bundle (entryPath) {
    return browserify({
      entries: [entryPath],
      debug: true, // source maps
    })
    .transform(babelify, babelifyConfig)
    .transform(uglifyify, {global: true})
    .bundle()
  }
}

// entryPath is relative to `client` directory
// bundleName output is relative to `build` directory
function clientApp (entryPath, bundleName) {
  return () => {
    mkdirp.sync(build)
    return bundle(path.join(client, entryPath))
    .pipe(exorcist(path.join(build, `${bundleName}.map`)))
    .pipe(source(bundleName))
    .pipe(gulp.dest(build))
  }
}

gulp.task('apply', clientApp('apps/apply/index.js', 'apply.js'))
gulp.task('login', clientApp('apps/login/index.js', 'login.js'))
gulp.task('match', clientApp('apps/match/index.js', 'match.js'))
gulp.task('clientApps', [
  'apply',
  'login',
  'match',
])

gulp.task('styles', () =>
  gulp.src(path.join(client, 'styles', '*.css'))
  .pipe(sourcemaps.init())
  .pipe(postcss([autoprefixer, precss, cssnano()]))
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest(build))
)

gulp.task('default', ['clientApps', 'styles'], () => {
  development && notifier.notify({
    title: 'HackCampus',
    message: 'build finished',
  })
})

gulp.start.call(gulp, 'default')
