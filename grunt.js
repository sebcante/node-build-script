var Generator = require('h5bp-docs'),
  path = require('path'),
  fork = require('child_process').fork;

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    docs: {
      wiki: {
        filter    : 'Home',
        template  : path.join(__dirname, './docs'),
        style     : 'grey',
        cwd       : path.join(__dirname, './docs'),
        files     : '**/*.md',
        assets    : '**/*.css',
        prefix    : './',
        relative  : false
      },
      api: {
        tasks     : 'src/tasks/**/*.js',
        lib       : 'src/lib/**/*.js',
        root      : 'src/*.js'
      }
    }
  });

  // Default task.
  grunt.registerTask('default', 'docs copy');
  grunt.registerTask('wiki', 'docs:wiki copy');
  grunt.registerTask('api', 'docs:api');


  // **docs** task - uses h5bp-docs on top of wiki submodule (path:
  // `docs/`) and docco on top of project's sources.
  //
  // This is a multi task with `wiki` and `api` as subtarget.
  grunt.registerMultiTask('docs', 'Generates docs', function() {
    var target = this.target,
      data = this.data,
      cb = this.async();

    if(grunt.option('serve')) data.serve = true;
    grunt.helper(target, data, function(err) {
      if(err) return grunt.fail(err);
      cb();
    });
  });


  // **wiki** helper - creates a new site, with given `data`
  // configuration. if `data.serve=true` then a http server is started
  // with live rebuilding (eg. page is rebuild / served on requests)
  grunt.registerHelper('wiki', function(data, cb) {
    var site = new Generator(data);
    site.on('error', function(er) {
      grunt.log.error('✗ Got error' + er.message);
      cb(err);
    });

    var now = +new Date;
    site.on('end', function() {
      grunt.log
        .ok(' ✔ Site generated in ' + ((+new Date - now) / 1000) + 's')
        .writeln(data.serve ? 'Try opening http://localhost:3000' : 'Try running: open docs/_site/index.html');
      if(data.serve) site.preview(cb);
      else cb();
    });

    // generate
    site.generate();
  });


  // **api**: Uses docco on top of gruntfile, tasks, and lib utils.
  grunt.registerHelper('api', function(data, cb) {
    var docco = require.resolve('docco'),
      categs = Object.keys(data);

    (function generate(categ) {
      if(!categ) return cb();
      grunt.log.writeln('Generating docco for ' + categ);
      var files = grunt.file.expandFiles(data[categ]);
      grunt.log.writeln('Files: ').writeln(grunt.log.wordlist(files, grunt.utils.linefeed));

      // the docco binary
      var doccobin = path.join(path.dirname(require.resolve('docco')), '../bin/docco');

      // destination dir
      var dest = path.join(__dirname, 'api', categ);

      // adjust filepath to opts.cwd
      files = files.map(function(file) {
        return path.join('../..', file);
      });

      // temporary check on filtering minified files (jquery.min in
      // tasks dir)
      files = files.filter(function(file) {
        return !/\.min\.js$/.test(file);
      });

      grunt.file.mkdir(dest);

      var docco = grunt.utils.spawn({
        cmd: 'node',
        args: [doccobin].concat(files),
        opts: {
          cwd: dest
        }
      }, function() {});

      docco.stdout.on('data', function() { grunt.log.write('.'); });
      docco.stderr.pipe(process.stderr);
      docco.on('error', cb).on('exit', function(code) {
        if(code) return cb(new Error('Error exit code not 0: ' + code));
        grunt.log.ok().ok("I'm done generating " + categ + ' - ' + dest).writeln();
        generate(categs.shift());
      });
    })(categs.shift());

    return;
  });



  // **copy** task - copy the files in docs/_site/* into ./
  grunt.registerTask('copy', function() {
    var base = 'docs/_site/';
    grunt.file.expandFiles(base + '**').forEach(function(file) {
      var dest = file.replace(base, '');
      // actual copy
      grunt.log.writeln('Copying ' + file).write('→ ' + dest + '...');
      grunt.file.copy(file, dest);
      grunt.log.ok();
    });
  });

};
