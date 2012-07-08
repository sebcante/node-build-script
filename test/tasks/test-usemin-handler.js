//
// Mocha generated tests
//

var fs = require('fs'),
  path = require('path'),
  assert = require('assert'),
  helpers = require('../helpers'),
  grunt = require('grunt');

// XXX test out data-main / rjs task | test out @import inlines

describe('Usemin handler task', function() {

  before(function(done) {
    helpers.setup({
      dest: '.test/',
      source: path.join(__dirname, 'usemin-handler'),
      gruntfile: path.join(__dirname, 'usemin-handler/grunt.js')
    }, done);
  });

  before(function(done) {
    var index = path.join(__dirname, 'usemin-handler/index.html'),
      gruntfile = path.join(__dirname, 'usemin-handler/grunt.js');

    grunt.file.copy(index, '.test/index.html');
    grunt.file.copy(gruntfile, '.test/grunt.js');

    grunt.file.write('.test/css/app-1.css', '.build .app-1 { color: #00e; }');
    grunt.file.write('.test/css/app-2.css', '.build .app-2 { color: #06e; }');

    grunt.file.write('.test/js/head-1.js', 'var head = "one";');
    grunt.file.write('.test/js/head-2.js', 'head += " two";');

    grunt.file.write('.test/js/app-1.js', 'var app = "one";');
    grunt.file.write('.test/js/app-2.js', 'app += "two";');
    grunt.file.write('.test/js/app-3.js', 'app += "three";');
    grunt.file.write('.test/js/app-4.js', 'app += "four";');
    grunt.file.write('.test/js/app-5.js', 'app += "five";');

    done();
  });


  describe('As a build script using usemin-handler to kick off the config', function() {
    it('Given I run the usemin task', function(done) {
      // to be aliased to build by default when ready, or build:usemin
      helpers.run('clean mkdirs usemin-handler concat rjs css min img rev usemin copy', done);
    });

    it('Then publish/index.html should be the same as index.expected.html', function(done) {
      helpers.assertFile('.test/publish/index.html', path.join(__dirname, 'usemin-handler/index.expected.html'));
      done();
    });

    it('And the revved CSS files should be concat / minified / revved', function(done) {
      // will most likely throw when rev changes, but tied to our before hook.
      assert.equal(grunt.file.read('.test/publish/css/07d0750b.app.css'), '.build .app-1{color:#00e}.build .app-2{color:#06e}');
      assert.equal(grunt.file.read('.test/publish/css/1a546ddd.app-1.css'), '.build .app-1 { color: #00e; }');
      assert.equal(grunt.file.read('.test/publish/css/971fb5b8.app-2.css'), '.build .app-2 { color: #06e; }');

      done();
    });

    it('And the JS files should be concat / minified / revved', function(done) {
      assert.equal(grunt.file.read('.test/publish/js/6e3bfc13.head-1.js'), 'var head = "one";');
      assert.equal(grunt.file.read('.test/publish/js/2ce86af7.head-2.js'), 'head += " two";');

      assert.equal(grunt.file.read('.test/publish/js/3808609e.app-1.js'), 'var app = "one";');
      assert.equal(grunt.file.read('.test/publish/js/bea3c07b.app-2.js'), 'app += "two";');
      assert.equal(grunt.file.read('.test/publish/js/2bc9366f.app-3.js'), 'app += "three";');
      assert.equal(grunt.file.read('.test/publish/js/a3e07ab9.app-4.js'), 'app += "four";');
      assert.equal(grunt.file.read('.test/publish/js/e5c6067a.app-5.js'), 'app += "five";');

      // minified, final output
      assert.equal(grunt.file.read('.test/publish/js/ad0a1fd9.head.js'), 'var head="one";head+=" two";');
      assert.equal(grunt.file.read('.test/publish/js/7d1bdffe.app.js'), 'var app="one";app+="two",app+="three",app+="four",app+="five";');

      done();
    });

  });

});
