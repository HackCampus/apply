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

const build = 'build'

gulp.task('app', () => {
  mkdirp.sync(build)
  return browserify({
    entries: ['client/index.js'],
    // fullPaths: true, // for disc
    debug: true,
  })
  .transform(babelify, {presets: ['es2015']})
  // .transform(uglifyify, {global: true})
  .bundle()
  .on('error', e => {
    exec(`osascript -e 'display notification "${e.message}" with title "hackcampus"'`)
    throw e
  })
  .pipe(exorcist(path.join(build, 'app.js.map')))
  .pipe(source('app.js'))
  .pipe(gulp.dest(build))
})

gulp.task('styles', () =>
  gulp.src('client/styles/*.css')
  .pipe(sourcemaps.init())
  .pipe(postcss([autoprefixer, precss, cssnano()]))
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest(build))
)

gulp.task('default', ['app', 'styles'], () => {
  exec(`osascript -e 'display notification "build finished" with title "hackcampus"'`)
})

gulp.start.call(gulp, 'default')
