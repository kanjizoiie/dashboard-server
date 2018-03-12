const gulp = require('gulp');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
 
gulp.task('default', () => {
    gulp.src('src/**/*.js')
        .pipe(babel())
        .pipe(uglify())
        .pipe(gulp.dest('dist/src'));

    gulp.src(['src/json/**/*'])
        .pipe(gulp.dest('dist/src/json/'));

    gulp.src(['src/logs/**/*'])
        .pipe(gulp.dest('dist/src/logs/'));

    gulp.src(['src/database/**/*'])
        .pipe(gulp.dest('dist/src/database/'));

    gulp.src(['package.json'])
        .pipe(gulp.dest('dist/'));
});

var licenseCrawler = require('gulp-license-crawler');

gulp.task('licenses', function() {
    return licenseCrawler()
        .pipe(gulp.dest('./licenses'))
});