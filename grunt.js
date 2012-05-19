var fs = require('fs'),
  path = require('path'),
  util = require('util'),
  path = require('path'),
  spawn = require('child_process').spawn,
  Parser = require('mocha-gherkin');

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
      // each task is tested individually, with basic files comparison with
      // what is in test/fixtures/
      tasks: ['test/tasks/test-*.js'],

      // default task with default options
      runThemAll: ['test/tasks/default.js']
    }
  });

  // Default task.
  grunt.registerTask('default', 'lint');


  grunt.loadTasks('./support/');

  // basic override of built-in test task to spawn mocha instead.
  //
  // should be improved and put in another grunt plugin.
  //
  grunt.registerMultiTask('test', 'Redefine the test task to spawn mocha instead', function() {
    var files = grunt.file.expandFiles(this.file.src);

    // path to mocha executable, set as devDependencies in package.json
    var mocha = path.join(__dirname, 'node_modules/mocha/bin/mocha');

    var cb = this.async();

    // run each file serially, take care of exiting on first fail
    (function run(file) {
      if(!file) return cb();
      var child = spawn('node', [mocha].concat(file));
      child.stdout.pipe(process.stdout);
      child.stderr.pipe(process.stderr);
      child.on('exit', function(code) {
        if(code) {
          grunt.warn(new Error('cmd failed'), code);
          return;
        }

        run(files.shift());
      });

    })(files.shift());
  });

  //
  // Run this task to quickly generate new test for a given task. A series of
  // prompt will ask for values which are used to process
  // test/features/template.feature. Feature file is then generated at
  // test/features/<taskname>.feature and Mocha test file at test/tasks/<taskname>.js
  //
  // Add a `--missing` or `--step `option to generate step definition file for
  // this feature instead of Mocha test. File is written at test/features/steps/<taskname>.js
  //
  // The parser will search for a test/features/steps/<taskname>.js file and use it to init
  // mocha assertion snippets.
  //
  grunt.registerTask('genmocha', 'Output instruction on how to generate a new test', function(taskname) {
    var cb = this.async();

    taskname = taskname || grunt.option('taskname') || 'foo';

    var missing = grunt.option('missing') || grunt.option('step');

    grunt.helper('prompt', {}, [{
      name: 'taskname',
      message: 'Which task would you like to test?',
      default: taskname,
      warning: 'grunt prompts are pretty cool'
    }, {
      name: 'feature',
      message: 'Feature?',
      default: taskname.toUpperCase() + ' task'
    }, {
      name: 'role',
      message: 'As a ?',
      default: ' build script user'
    }, {
      name: 'action',
      message: 'I want to ?',
      default: 'be able to run the ' + taskname + ' task'
    }, {
      name: 'benefit',
      message: 'So that ?',
      default: 'I can see the ' + taskname + ' task in action'
    }, {
      name: 'scenario',
      message: 'Scenario: ?',
      default: taskname + ' task'
    }, {
      name: 'context',
      message: 'Given ?',
      default: 'I run the "'+ taskname + '" task'
    }, {
      name: 'event',
      message: 'When ?',
      default: 'the script ends'
    }, {
      name: 'outcome',
      message: 'Then ?',
      default: '".test/:task" should be the same as "test/fixtures/:task/expected/"'
        .replace(/:task/g, taskname)
    }], function(err, props) {
      if(err) return grunt.warn(err);
      var taskdir = path.join(__dirname, 'tasks');
      if(!path.extname(props.taskname)) props.taskname = props.taskname + '.js';

      var exists = path.existsSync(path.join(taskdir, props.taskname));
      if(!exists) {
        grunt.log.error('Not a known task + ' + props.taskname);
        grunt.log.error(grunt.log.wordlist(fs.readdirSync(taskdir)));
        return grunt.warn('failed generating test for ' + props.taskname);
      }

      // 1. create the feature
      var feature = grunt.file.read('test/features/template.feature');
      feature = grunt.template.process(feature, props);

      // 2. Write feature to test/features
      var featurefile = props.taskname.replace(path.extname(props.taskname), '.feature');

      var filename = 'test/features/' + featurefile;
      grunt.log.ok('Generate feature ' + filename);
      grunt.file.write(filename, feature);

      // 3. Generate according mocha specs from feature file

      var step = path.join('test/features/steps', props.taskname);
      step = path.existsSync(step) ? step : 'test/features/steps/default.js';
      var parser = new Parser({
        missing: missing,
        step: fs.readFileSync(step, 'utf8'),
        modules: [{
          name: 'helpers',
          path: '../helpers'
        }]
      });

      var testfile = path.join('test', (missing ? 'features/steps' : 'tasks'), 'test-' + props.taskname);
      grunt.log.ok('Generate ' + (missing ? 'step definition file ' : 'testfile ') + testfile);

      parser.pipe(process.stdout);
      parser.pipe(fs.createWriteStream(testfile));
      fs.createReadStream(filename).pipe(parser).on('close', cb);
    });
  });

};
