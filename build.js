const autoprefixer = require('autoprefixer')
const babelify = require('babelify')
const browserify = require('browserify')
const {exec} = require('child_process')
const cssnano = require('cssnano')
const exorcist = require('exorcist')
const fs = require('fs')
const gulp = require('gulp')
const postcss = require('gulp-postcss')
const sourcemaps = require('gulp-sourcemaps')
const mkdirp = require('mkdirp')
const path = require('path')
const precss = require('precss')
const uglifyify = require('uglifyify')
const source = require('vinyl-source-stream')

const build = path.join(__dirname, 'app', 'build')
const client = path.join(__dirname, 'app', 'client')

const development = process.env.NODE_ENV !== 'production'

const notifier = development ? require('node-notifier') : function () {}

const babelifyConfig = {
  presets: ['es2015'],
}

if (development) {
  const browserifyIncremental = require('browserify-incremental')
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

gulp.task('apply', clientApp('apps/apply/index.js', 'apply/index.js'))
gulp.task('login', clientApp('apps/login/index.js', 'login/index.js'))
gulp.task('match', clientApp('apps/match/index.js', 'match/index.js'))
gulp.task('clientApps', [
  'apply',
  'login',
  'match',
])

const styles = (srcDirectory) =>
  gulp.src(srcDirectory)
  .pipe(sourcemaps.init())
  .pipe(postcss([autoprefixer, precss, cssnano()]))
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest(build))

gulp.task('app styles', () =>
  styles(path.join(client, 'apps', '*', 'styles.css'))
)

gulp.task('common styles', () =>
  styles(path.join(client, 'styles', '*.css'))
)

gulp.task('styles', [
  'app styles',
  'common styles',
])

gulp.task('default', ['clientApps', 'styles'], () => {
  development && notifier.notify({
    title: 'HackCampus',
    message: 'build finished',
  })
})

gulp.start.call(gulp, 'default')
