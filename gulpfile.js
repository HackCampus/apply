const autoprefixer = require('autoprefixer')
const babelify = require('babelify')
const browserify = require('browserify')
const {exec} = require('child_process')
const cssnano = require('cssnano')
const exorcist = require('exorcist')
const fs = require('fs')
const gulp = require('gulp')
const gulpBabel = require('gulp-babel')
const nodemon = require('gulp-nodemon')
const postcss = require('gulp-postcss')
const sourcemaps = require('gulp-sourcemaps')
const mkdirp = require('mkdirp')
const path = require('path')
const precss = require('precss')
const uglifyify = require('uglifyify')
const source = require('vinyl-source-stream')

const sourcePath = path.join(__dirname, 'src')
const buildPath = path.join(__dirname, 'build')
const clientSource = path.join(sourcePath, 'client')
const clientBuild = path.join(buildPath, 'client')

const development = process.env.NODE_ENV !== 'production'

const notifier = development ? require('node-notifier') : {notify () {}}

//
// Server compilation
//

gulp.task('server', () => {
  return gulp.src([path.join(sourcePath, '**', '*.js'), '!' + clientSource])
    .pipe(gulpBabel({
      plugins: [
        'transform-flow-strip-types'
      ]
    }))
    .pipe(gulp.dest(buildPath))
})

//
// Client JS bundling
//

const babelifyConfig = {
  presets: [['env', {
    targets: {
      browsers: ['last 2 versions'],
    },
  }]],
}

if (development) {
  const browserifyIncremental = require('browserify-incremental')
  function bundle (entryPath) {
    return browserifyIncremental({
      entries: [entryPath],
      debug: true, // source maps
      cacheFile: path.join(clientBuild, '.buildCache.json')
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

// entryPath is relative to `clientSource` directory
// bundleName output is relative to `clientBuild` directory
function clientApp (entryPath, bundleName) {
  return () => {
    mkdirp.sync(clientBuild)
    return bundle(path.join(clientSource, entryPath))
      .pipe(exorcist(path.join(clientBuild, `${bundleName}.map`)))
      .pipe(source(bundleName))
      .pipe(gulp.dest(clientBuild))
  }
}

gulp.task('apply', clientApp('apps/apply/index.js', 'apply/index.js'))
gulp.task('companies', clientApp('apps/companies/index.js', 'companies/index.js'))
gulp.task('login', clientApp('apps/login/index.js', 'login/index.js'))
gulp.task('match', clientApp('apps/match/index.js', 'match/index.js'))
gulp.task('matchDetail', clientApp('apps/matchDetail/index.js', 'matchDetail/index.js'))
gulp.task('profile', clientApp('apps/profile/index.js', 'profile/index.js'))
gulp.task('clientApps', [
  'apply',
  'companies',
  'login',
  'match',
  'matchDetail',
  'profile',
])

//
// Client CSS
//

const styles = (srcDirectory) =>
  gulp.src(srcDirectory)
    .pipe(sourcemaps.init())
    .pipe(postcss([autoprefixer, precss, cssnano()]))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(clientBuild))

gulp.task('app styles', () =>
  styles(path.join(clientSource, 'apps', '*', 'styles.css'))
)

gulp.task('common styles', () =>
  styles(path.join(clientSource, 'styles', '*.css'))
)

gulp.task('styles', [
  'app styles',
  'common styles',
])

//
// Entrypoints
//

gulp.task('default', ['server', 'clientApps', 'styles'], () => {
  notifier.notify({
    title: 'HackCampus',
    message: 'build finished',
  })
})

gulp.task('watch-server', ['server'], () => {
  return nodemon({
    script: path.join(buildPath, 'index.js'),
    watch: sourcePath,
    ignore: [clientSource],
    tasks: ['server'],
  })
})

gulp.task('watch-client', ['clientApps', 'styles'], () => {
  return nodemon({
    script: 'empty.js',
    watch: clientSource,
    tasks: ['clientApps', 'styles']
  })
})
