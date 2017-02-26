'use strict';

var should = require('chai').should(),
  migrator = require('../migrator.js'),
  fakehexoFactory = require('./fakehexoFactory.js'),
    fakeHexo;

describe("migrator", function () {

  this.timeout(10000);

  beforeEach(function () {
    fakeHexo = fakehexoFactory.create();
    migrator.registerMigrator(fakeHexo);
  });

  it("registers rss", function () {
    fakeHexo.setValues.registeredType.should.equal("rss");
  });

    context("called with \"rss\"", function () {
    it("passes parameter through", function (done) {
      fakeHexo.call("migrate", { _: ["rss"] }, function (err) {
        if (err) throw err;
        fakeHexo.setValues.calledType.should.equal("rss");
        done();
      });
    });
  });

  context("no flags passed", function () {

    it("creates posts without alias field", function (done) {
      fakeHexo.call("migrate", { _: ["rss", "https://github.com/danmactough/node-feedparser/raw/master/test/feeds/rss2sample.xml"] },
        function (err) {
          if (err) throw err;
          fakeHexo.setValues.receivedPosts.length.should.be.gt(0);
          should.not.exist(fakeHexo.setValues.receivedPosts[0].alias);
          done();
        });
    });
  });

  context("alias flag passed", function () {
    it("creates posts with alias field", function (done) {
      fakeHexo.call("migrate", { _: ["rss", "https://github.com/danmactough/node-feedparser/raw/master/test/feeds/rss2sample.xml"], alias: true },
        function (err) {
          if (err) throw err;
          fakeHexo.setValues.receivedPosts.length.should.be.gt(0);
          should.exist(fakeHexo.setValues.receivedPosts[0].alias, "alias missing");
          done();
        });
    });
  });

  context("limit flag passed", function () {

    it("creates limited number of posts", function (done) {
      fakeHexo.call("migrate", { _: ["rss", "https://github.com/danmactough/node-feedparser/raw/master/test/feeds/rss2sample.xml"], limit: 1 },
        function (err) {
          if (err) throw err;
          fakeHexo.setValues.receivedPosts.length.should.equal(1);
          done();
        });
      fakeHexo.call("migrate", { _: ["rss", "https://github.com/danmactough/node-feedparser/raw/master/test/feeds/rss2sample.xml"], limit: 2 },
        function (err) {
          if (err) throw err;
          fakeHexo.setValues.receivedPosts.length.should.equal(2);
          done();
        });
    });
  });

  context("preventDuplicates flag passed", function () {
    it("grabs all posts, even duplicates", function (done) {
      fakeHexo.call("migrate", { _: ["rss", "https://github.com/danmactough/node-feedparser/raw/master/test/feeds/rss2sample.xml"] },
        function (err) {
          if (err) throw err;
          fakeHexo.setValues.receivedPosts.length.should.equal(4);
          done();
        });
    });
    
    it("does not duplicate posts with the same title", function (done) {
      fakeHexo.call("migrate", { _: ["rss", "https://github.com/danmactough/node-feedparser/raw/master/test/feeds/rss2sample.xml"], preventDuplicates: 1 },
        function (err) {
          if (err) throw err;
          fakeHexo.setValues.receivedPosts.length.should.equal(2);
          done();
        });
    });
  });

});

