const autoprefixer = require('autoprefixer')
const browserify = require('browserify')
const cssnano = require('cssnano')
const exorcist = require('exorcist')
const fs = require('fs')
const gulp = require('gulp')
const postcss = require('gulp-postcss')
const precss = require('precss')
const sourcemaps = require('gulp-sourcemaps')
const mkdirp = require('mkdirp')
const path = require('path')
const source = require('vinyl-source-stream')

const build = 'build'

gulp.task('app', () => {
  mkdirp.sync(build)
  return browserify({
    entries: ['client/index.js'],
    fullPaths: true, // for disc
    debug: true,
  })
  .transform('es2040')
  // .transform({global: true}, 'uglifyify')
  .bundle()
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

gulp.task('default', ['app', 'styles'])

gulp.start.call(gulp, 'default')