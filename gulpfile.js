var gulp = require('gulp');
var uglify = require('gulp-terser');
var uglifyes = require('gulp-uglify-es').default;
var rename = require('gulp-rename');
var cleanCSS = require('gulp-clean-css');
var concat = require('gulp-concat');
var del = require('del');
var image = require('gulp-image');
var watch = require('gulp-watch');
var sourcemaps = require('gulp-sourcemaps');
var exec = require('child_process').exec;
var pump = require('pump');
var sitemap = require('gulp-sitemap');
var robots = require('gulp-robots');
var replace = require('gulp-replace');
var handlebars = require('gulp-handlebars');
var server = require('gulp-webserver');
var RevAll = require('gulp-rev-all');
var sass = require('gulp-sass');
var pug = require('gulp-pug');
var tap = require('gulp-tap');
var fs = require('fs');
var path = require('path')
var puglatizer = require('puglatizer')
var envs = require('./.env.json');

sass.compiler = require('node-sass');

gulp.task('clean:all', function () {
  return del([
    'dist/**/*',
    'prerev/**/*'
  ]);
});

gulp.task('clean:dist', function () {
  return del([
    'dist/**/*',
  ]);
});

gulp.task('config', function () {
  stream = gulp.src(['assets/js/config/config.js']);
  console.log("abcdefg");
  console.log(stream)
  for (const key in envs) {
    stream.pipe(replace('${' + key + '}', envs[key])); 
  }

  stream.pipe(gulp.dest('prerev/assets/js/'));
});

gulp.task('common-lib-js', function (cb) {

  pump([
    gulp.src([
      'node_modules/@coreui/coreui/dist/js/coreui.min.js',
      'assets/js/common-lib/bootstrap-notify.min.js',
      'assets/js/common-lib/jqBootstrapValidation.js',
      'assets/js/common-lib/handlebars-v4.0.11.js',
      'assets/js/common-lib/Chart.bundle.min.js',
      'assets/js/common-lib/utilities.js',      
      'assets/js/common-lib/spin.min.js',
      'assets/js/common-lib/ladda.min.js',
      'assets/js/common-lib/loading-button.js',
    ]),
    sourcemaps.init(),
    concat('common-lib.js'),
    gulp.dest('prerev/assets/js/'),
    uglify(),
    rename({ extname: '.min.js' }),
    sourcemaps.write('maps'),
    gulp.dest('prerev/assets/js/')
  ], cb);
});

gulp.task('public-lib-js', function () {
  pump([
    gulp.src([
      'assets/js/public-lib/jquery.easing.1.3.js',
      'assets/js/public-lib/classie.js',
      'assets/js/public-lib/count-to.js',
      'assets/js/public-lib/jquery.appear.js',
      'assets/js/public-lib/cbpAnimatedHeader.js',
      'assets/js/public-lib/owl.carousel.js',
      'assets/js/public-lib/jquery.fitvids.js',
      'assets/js/public-lib/styleswitcher.js'
    ]),
    sourcemaps.init(),
    concat('public-lib.js'),
    uglify(),
    rename({ extname: '.min.js' }),
    sourcemaps.write('maps'),
    gulp.dest('prerev/assets/js/')
  ])
});

gulp.task('private-lib-js', function () {
  pump([
    gulp.src([
      'assets/js/private-lib/aws-cognito-sdk.min.js',
      'assets/js/private-lib/amazon-cognito-identity.min.js',
      'assets/js/private-lib/account-selector.js',
      'assets/js/private-lib/cognito-auth.js'
    ]),
    sourcemaps.init(),
    concat('private-lib.js'),
    uglify(),
    rename({ extname: '.min.js' }),
    sourcemaps.write('maps'),
    gulp.dest('prerev/assets/js/')
  ])
});


gulp.task('custom-js', function () {
  return src_wrap('assets/js/custom/**/*.js')
    .pipe(gulp.dest('prerev/assets/js/'));
});

gulp.task('muuri-js', function () {
  pump([
    gulp.src([
      'assets/js/others/web-animations.min.js',
      'assets/js/others/hammer.min.js',
      'assets/js/others/muuri.min.js',
    ]),
    sourcemaps.init(),
    concat('muuri-lib.js'),
    rename({ extname: '.min.js' }),
    sourcemaps.write('maps'),
    gulp.dest('prerev/assets/js/')
  ])
});

gulp.task('datatable-js', function () {
  pump([
    gulp.src([
      'assets/js/others/jquery.dataTables.min.js',
      'assets/js/others/dataTables.bootstrap.min.js',
    ]),
    sourcemaps.init(),
    concat('datatable-lib.js'),
    rename({ extname: '.min.js' }),
    sourcemaps.write('maps'),
    gulp.dest('prerev/assets/js/')
  ])
});

gulp.task('hbs-templates', function () {
  return src_wrap('templates/*.hbs')
    .pipe(handlebars())
    .pipe(gulp.dest('prerev/assets/js/hbs-templates/'));
});

gulp.task('pack-lib-css', function () {
  return gulp.src(['assets/css/lib/**/*.css'])
    .pipe(cleanCSS())
    .pipe(concat('lib.css'))
    .pipe(gulp.dest('prerev/assets/css/'));
});

gulp.task('scss', function () {
  return gulp.src(['assets/css/scss/*'])
    .pipe(sass())
    .pipe(gulp.dest('prerev/assets/css/scss/'));
});

gulp.task('custom-css', function () {
  return src_wrap(['assets/css/custom/**/*.css'])
    .pipe(cleanCSS())
    .pipe(gulp.dest('prerev/assets/css/'));
});

gulp.task('others-css', function () {
  return src_wrap(['assets/css/others/**/*.css'])
    .pipe(cleanCSS())
    .pipe(gulp.dest('prerev/assets/css/'));
});

gulp.task('pack-fonts', function () {
  return gulp.src(['assets/fonts/*'])
    .pipe(gulp.dest('prerev/assets/fonts/'));
});

gulp.task('image', function () {
  gulp.src('assets/images/**/*')
    .pipe(image({ svgo: false, zopflipng: false }))
    .pipe(gulp.dest('prerev/assets/images/'));
});

gulp.task('favicon', function () {
  gulp.src('assets/images/favicon.ico')
    .pipe(gulp.dest('prerev/'));
});

gulp.task('others-css', function () {
  return src_wrap(['assets/css/others/**/*.css'])
    .pipe(cleanCSS())
    .pipe(gulp.dest('prerev/assets/css/'));
});

function src_wrap(paths, base = null, ignoreInitial = false) {
  function options() {
    if (base) {
      return { base: base, ignoreInitial: ignoreInitial, interval: 1000 }
    }
    return { ignoreInitial: ignoreInitial, interval: 1000 }
  }
  return noWatch() ? gulp.src(paths, options()) : watch(paths, options())
}

// gulp.task('test', function () {
//   // watch('pug/templates/**/*.pug', {ignoreInitial: true}).pipe(tap(function(file, t) { 
//   //   console.log(file);
//   //  }))
//   src_wrap('pug/templates/**/*.pug', false, true).pipe(tap(function(file, t) { 
//       console.log(file);
//      }))
// })

gulp.task('pug-views', function () {
  return src_wrap('pug/views/**/*.pug', './pug/views/').pipe(pug({
    doctype: 'html',
    pretty: true,
    basedir: 'pug/',
    verbose: true
  })).pipe(gulp.dest('prerev/'));
});

function getFolders(dir) {
  return fs.readdirSync(dir)
    .filter(function (file) {
      return fs.statSync(path.join(dir, file)).isDirectory();
    });
}

//TODO: Add code to watch the pug templates
gulp.task('pug-templates', function () {
  function compile_templates() {
    return puglatizer("pug/templates", 'prerev/templates/all.js', {
      pug: {
        compileDebug: true
      }
    })
  }
  try { fs.mkdirSync('prerev'); } catch (error) { }
  try { fs.mkdirSync('prerev/templates/') } catch (error) { }
  compile_templates()
})
// gulp.task('pug-templates', function () {
//   var templatesDir = 'pug/templates'
//   function dir_compile_templates(directory) {
//     dirName = path.relative(process.cwd(), directory).split(path.sep).pop()
//     return puglatizer(directory, 'prerev/templates/' + dirName + '.js', {
//       pug: {
//         compileDebug: true
//       }
//     })
//   }
//   function compile_templates() {
//     var folders = getFolders(templatesDir);
//     if (folders.length === 0) return done(); // nothing to do!
//     var tasks = folders.map(function (folder) {
//       return puglatizer(path.join(templatesDir, folder), 'prerev/templates/' + path.basename(folder) + '.js', {
//         pug: {
//           compileDebug: true
//         }
//       })
//     });
//   }
//   try { fs.mkdirSync('prerev'); } catch (error) { }
//   try { fs.mkdirSync('prerev/templates/') } catch (error) { }
//   compile_templates()
//   if (!noWatch()) {
//     function compile_templates_for_dir() {
//       var folders = getFolders(templatesDir);
//       if (folders.length === 0) return done(); // nothing to do!
//       var tasks = folders.map(function (folder) {
//         return src_wrap('pug/templates/' + folder + '/*.pug', false, true).pipe(tap(function (file, t) {
//           console.log('asfasffsa')
//           dir_compile_templates(path.dirname(path.relative(process.cwd(), file.path)))
//         }))
//       });
//     }
//     return compile_templates_for_dir()
//   }
// });

gulp.task('pug-pages', function () {
  return src_wrap('pug/pages/**/*.pug', './pug/pages/').pipe(pug({
    doctype: 'html',
    pretty: true,
    basedir: 'pug/',
    verbose: true
  })).pipe(gulp.dest('prerev/'));
});

gulp.task('pug', ['pug-views', 'pug-pages', 'pug-templates']);


gulp.task('generate-staging-sitemap', function () {
  gulp.src(['dist/index.html', 'dist/auth.html',
    'dist/features.html', 'dist/privacy-policy.html', 'dist/user-guide.html'], {
    read: false
  })
    .pipe(sitemap({
      siteUrl: 'https://staging.example.com'
    }))
    .pipe(gulp.dest('dist/'));
  console.log('sitemap called');
});


gulp.task('deploy-staging', ['generate-staging-sitemap', 'revision', 'robots'], function (cb) {
  exec('aws s3 rm s3://staging.example.com/ --recursive; aws s3 sync dist/ s3://staging.example.com/ --exclude ".git*" --exclude "node_modules*" --exclude ".idea*"', function (err, stdout, stderr) {
    console.log("in s3 sync");
    console.log(stdout);
    console.log(stderr);
    if (stderr) {
      return;
    }
    exec('aws cloudfront create-invalidation --distribution-id "E1MN1QBYF9YCC5" --paths "/*"', function (err, stdout, stderr) {
      console.log("in Invalidate");
      console.log(stdout);
      console.log(stderr);
    });
  });
});

gulp.task('generate-live-sitemap', function () {

  gulp.src(['dist/index.html', 'dist/auth.html',
    'dist/features.html', 'dist/privacy-policy.html', 'dist/user-guide.html'], {
    read: false
  }).pipe(sitemap({
    siteUrl: 'https://example.com'
  })).pipe(gulp.dest('dist/'))
});

gulp.task('deploy-live', ['generate-live-sitemap', 'revision', 'robots'], function (cb) {
  exec('aws s3 rm s3://example.com/ --recursive; aws s3 sync dist/ s3://example.com/ --exclude ".git*" --exclude "node_modules*" --exclude ".idea*"', function (err, stdout, stderr) {
    console.log("in s3 sync");
    console.log(stdout);
    console.log(stderr);
    if (stderr) {
      return;
    }
    exec('aws cloudfront create-invalidation --distribution-id "E3207TQD9AYGMM" --paths "/*"', function (err, stdout, stderr) {
      console.log("in Invalidate");
      console.log(stdout);
      console.log(stderr);
    });
  });
});

gulp.task('robots', function () {
  gulp.src('index.html')
    .pipe(robots({
      useragent: '*',
      disallow: ['/i/dashboard.html', '/i/integrations/aws-account-setup.html', '/i/tag-resources.html', '/i/security-issues.html', '/i/maintenance-tasks.html', '/i/unused-resources.html']
    }))
    .pipe(gulp.dest('dist/'));
});

function noWatch() {
  if (process.argv.indexOf("--nowatch") > -1) {
    return true;
  }
  return false;
}

gulp.task('revision', ['no-revision'], function () {
  gulp.src(['prerev/**'])
    .pipe(RevAll.revision({
      dontRenameFile: [/\.*favicon.*/g, /^\/robots.txt$/g, /^\/sitemap.xml$/g, '.html'],
      dontUpdateReference: [/\.*favicon.*/g, /^\/robots.txt$/g, /^\/sitemap.xml$/g, '.html'],
      dontSearchFile: [/\.*favicon.*$/g, /^\/robots.txt$/g, /^\/sitemap.xml$/g, /\/(?!(config)\.js$)[^\/]*\.js$/],
    }))
    .pipe(gulp.dest('./dist'))
})

gulp.task('no-revision', function () {
  return true;
})

gulp.task('server', function () {
  if (noWatch()) {
    console.log("NoWatch so not running the server");
  } else {
    gulp.src('prerev')	// <-- your app folder
      .pipe(server({
        livereload: true,
        open: false,
        port: 5001,	// set a port to avoid conflicts with other local apps
        host: "0.0.0.0"
      }));
  }
});

gulp.task('dist-server', function () {
  if (noWatch()) {
    console.log("NoWatch so not running the server");
  } else {
    gulp.src('dist')	// <-- your app folder
      .pipe(server({
        livereload: true,
        open: false,
        port: 5001,	// set a port to avoid conflicts with other local apps
        host: "0.0.0.0"
      }));
  }
});

gulp.task('default', ["config", 'common-lib-js',
  'public-lib-js',
  'private-lib-js',
  'custom-js',
  'pack-lib-css',
  'scss',
  'others-css',
  'muuri-js',
  'datatable-js',
  'hbs-templates',
  'custom-css',
  'pug',
  'pack-fonts',  
  'favicon', 'clean:dist', 'server'], function () {
    console.log('in default');
  });