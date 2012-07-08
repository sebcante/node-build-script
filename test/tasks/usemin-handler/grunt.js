var path = require('path');

module.exports = function(grunt) {
  grunt.config.init({
    // the staging directory used during the process
    staging: 'intermediate/',
    // final build output
    output: 'publish/',

    mkdirs: {
      staging: './'
    },

    // tell the build script what files it should handle and read config from
    'usemin-handler': {
      html: ['*.html']
    },

    rev: {
      js: 'js/**/*.js',
      css: 'css/**/*.css',
      img: 'img/**/*'
    },

    img: {
      dist: '<config:rev.img>'
    },

    usemin: {
      html: ['**/*.html', '**/*.mustache', '**/*.hbs'],
      css: ['**/*style.css']
    },

    html: {
      files: ['**/*.html']
    }
  });


  grunt.loadNpmTasks(path.join(__dirname, '..'));

};
