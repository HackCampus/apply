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
const notifier = require('node-notifier')
const path = require('path')
const precss = require('precss')
const uglifyify = require('uglifyify')
const source = require('vinyl-source-stream')

const build = path.join('app', 'build')
const client = path.join('app', 'client')

const development = process.env.NODE_ENV !== 'production'

const babelifyConfig = {
  presets: ['es2015'],
}

if (development) {
  function bundle (entryPath) {
    return browserify({
      entries: [entryPath],
      fullPaths: true, // for disc
      debug: true, // source maps
    })
    .transform(babelify, babelifyConfig)
    .bundle()
    .on('error', e => {
      notifier.notify({
        title: 'HackCampus',
        message: e.message,
      })
      throw e
    })
  }
} else {
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

gulp.task('app', () => {
  mkdirp.sync(build)
  return bundle(path.join(client, 'index.js'))
  .pipe(exorcist(path.join(build, 'app.js.map')))
  .pipe(source('app.js'))
  .pipe(gulp.dest(build))
})

gulp.task('styles', () =>
  gulp.src(path.join(client, 'styles', '*.css'))
  .pipe(sourcemaps.init())
  .pipe(postcss([autoprefixer, precss, cssnano()]))
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest(build))
)

gulp.task('default', ['app', 'styles'], () => {
  development && notifier.notify({
    title: 'HackCampus',
    message: 'build finished',
  })
})

gulp.start.call(gulp, 'default')
