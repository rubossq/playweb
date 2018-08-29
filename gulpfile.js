'use strict';

const gulp = require('gulp');
const debug = require('gulp-debug');
const gulpIf = require('gulp-if');
const uglify = require('gulp-uglify');
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('gulp-autoprefixer');
const cssnano = require('gulp-cssnano');
const concat = require('gulp-concat');
const order = require('gulp-order');
const del = require('del');
const jshint = require('gulp-jshint');

let isDev = !process.env.NODE_ENV  || process.env.NODE_ENV === 'development'

gulp.task('prepare:scripts', function(){
    return gulp.src('assets/scripts/*.js')
        .pipe(debug({title: "src"}))
        .pipe(gulpIf(isDev, sourcemaps.init()))
        .pipe(uglify())
        .pipe(debug({title: "uglify"}))
        .pipe(gulpIf(isDev, sourcemaps.write()))
        .pipe(gulp.dest('public/js'))
        .pipe(debug({title: "dest"}));
});

gulp.task('prepare:styles', function(){
    return gulp.src(['assets/styles/style.css', 'assets/styles/media.css'])
        .pipe(debug({title: "src"}))
        .pipe(autoprefixer())
        .pipe(cssnano())
        .pipe(debug({title: "cssnano"}))
        .pipe(gulpIf(isDev, sourcemaps.init()))
        .pipe(debug({title: "order"}))
        .pipe(concat('bundle.css'))
        .pipe(gulpIf(isDev, sourcemaps.write()))
        .pipe(gulp.dest('public/css'))
        .pipe(debug({title: "dest"}));
});

gulp.task('linter', function(){
    return gulp.src('assets/scripts/*.js')
        .pipe(debug({title: "src"}))
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('clean:scripts', function(){
    return del('public/js/main.js');
});

gulp.task('clean:styles', function(){
    return del('public/styles/style.js');
});

gulp.task('clean', gulp.series('clean:scripts', 'clean:styles'));

gulp.task('build', gulp.series('clean', gulp.parallel(gulp.series('linter', 'prepare:scripts'), 'prepare:styles')));

gulp.watch('assets/scripts/*.js', gulp.series('clean:scripts', 'linter', 'prepare:scripts'));
gulp.watch('assets/styles/*.css', gulp.series('clean:styles', 'prepare:styles'));
