const gulp = require('gulp');
const babel = require('gulp-babel');
 
gulp.task('default', () => {
    gulp.src('src/**/*.js')
        .pipe(babel())
        .pipe(gulp.dest('dist'));
    gulp.src(['src/json/**/*'])
        .pipe(gulp.dest('dist/json/'));
    gulp.src(['src/logs/**/*'])
        .pipe(gulp.dest('dist/logs/'));
    gulp.src(['src/database/**/*'])
        .pipe(gulp.dest('dist/database/'));
});