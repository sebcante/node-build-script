var util = require('util'),
  path = require('path'),
  spawn = require('child_process').spawn;

/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    lint: {
      grunt: ['grunt.js', 'tasks/*.js'],
      lib: ['lib/plugins/*.js']
    },
    watch: {
      files: '<config:lint.grunt>',
      tasks: 'lint:grunt'
    },
    jshint: {
      options: {
        es5: true,
        node: true,
        curly: false,
        eqeqeq: true,
        immed: true,
        latedef: false,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true
      }
    },
    test: {
      tasks: ['test/tasks/*.js']
    }
  });

  // Default task.
  grunt.registerTask('default', 'lint');

  // some debugging helpers
  grunt.registerTask('list-helpers', 'List all grunt registered helpers', function(helper) {
    var ls = grunt.log.wordlist(Object.keys(grunt.task._helpers), grunt.utils.linefeed);
    if(!helper) return grunt.log.ok(ls);
    grunt.log.subhead(helper + ' source:').ok(grunt.task._helpers[helper]);
  });

  grunt.registerTask('list-task', 'List all grunt registered tasks', function(t) {
    var ls = grunt.log.wordlist(Object.keys(grunt.task._tasks), grunt.utils.linefeed);
    if(!t) return grunt.log.ok(ls);
    grunt.log.subhead(t + ' source:');
    grunt.helper('inspect', grunt.task._tasks[t]);
  });

  // and the doc generation for the docs task
  grunt.registerTask('gendocs', 'Generates docs/index.html from wiki pages', function() {
    var cb = this.async();

    var gendoc = grunt.utils.spawn({
      cmd: 'grunt', opts: { cwd: path.join(__dirname, 'scripts/docs') }
    }, function() {});

    gendoc.stdout.pipe(process.stdout);
    gendoc.stderr.pipe(process.stderr);
    gendoc.on('exit', function(code) {
      if(code) grunt.warn('Something bad happend', code);
      cb();
    });
  });

  // basic override of built-in test task to spawn mocha instead.
  //
  // should be improved and put in another grunt plugin.
  //
  grunt.registerMultiTask('test', 'Redefine the test task to spawn mocha instead', function() {
    var files = grunt.file.expandFiles(this.file.src);

    // path to mocha executable, set as devDependencies in package.json
    var mocha = path.join(__dirname, 'node_modules/mocha/bin/mocha');

    var cb = this.async();
    var child = spawn('node', [mocha].concat(files));

    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
    child.on('exit', function(code) {
      if(code) grunt.warn(new Error('cmd failed'), code);
      cb();
    });
  });

};
