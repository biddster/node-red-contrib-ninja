/**
 * Created by luke on 03/07/15.
 */

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();

gulp.task('tests', function () {
    return gulp.src('tests/*.js', {read: false})
        // gulp-mocha needs filepaths so you can't have any plugins before it
        .pipe($.mocha({reporter: 'nyan'}));
});

gulp.task('default', ['tests']);