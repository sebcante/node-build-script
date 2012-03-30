
var fs = require('fs'),
  join = require('path').join,
  exec = require('child_process').exec,
  env = process.env;

//
// Testing out source maps generation with closure compiler.
//
// Now shipping latest closure-compiler in vendor/, may opt
// to use a configuration property or a environment variable like
//
//    $H5BP_COMPILER=/path/to/compiler-latest/compiler.jar
//
// > http://closure-compiler.googlecode.com/files/compiler-latest.zip
//

module.exports = function(grunt) {
  // Grunt utilities.
  var task = grunt.task,
    config = grunt.config,
    utils = grunt.utils,
    file = grunt.file,
    log = grunt.log;

  config('sourcemap', {
    'publish/js/test.sourcemap.js': ['publish/js/*.js']
  });

  grunt.registerMultiTask('sourcemap', 'Runs closure compiler with source map turned on', function() {
    var target = this.target,
      data = this.data,
      cb = this.async();

    var files = file.expandFiles(data);

    // figure out the path to the jar compiler, or print help output
    var compiler = config('compiler') || env.H5BP_COMPILER || env.h5bp_compiler;
    if(!compiler) return fs.createReadStream(join(__dirname, '../../docs/sourcemap.md'))
        .on('close', cb)
        .pipe(process.stdout);

    var args = [
      '-jar ' + compiler,
      '--create_source_map ' + this.target + '.map',
      '--source_map_format=V3',
      '--js_output_file ' + this.target
    ];

    args = args.concat(files.map(function(f) {
      return '--js ' + f;
    }));

    log.writeln('java ' + args.join(' ')).writeln();

    log
      .writeln('Running ' + log.wordlist(files) + ' through Closure Compiler')
      .writeln('Generating source map file at ' + this.target + '.map');

    exec('java ' + args.join(' '), function(error, stdout, stderr) {
      if(!error) log.ok('File output » ' + target);
      else log.error(stderr);

      cb(!error);
    });
  });

};



