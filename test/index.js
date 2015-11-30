'use strict';

var should = require('chai').should(),
	migrator = require('../migrator.js'),
	fakehexoFactory = require('./fakehexoFactory.js'),
    fakeHexo;

describe("migrator rss", function () {
	beforeEach(function () {
		fakeHexo = fakehexoFactory.create();
		migrator.registerMigrator(fakeHexo);
	});

	it("registers \"rss\" to hexo", function () {
		fakeHexo.setValues.registeredType.should.equal("rss");
	});

    context("called with \"rss\"", function () {
		it("passes parameter through", function () {
			fakeHexo.call("migrate", { _: ["rss"] });
			fakeHexo.setValues.calledType.should.equal("rss");
		})

	});

	context("passed source without alias flag", function () {
		it("creates posts without alias", function (done) {
			fakeHexo.call("migrate", { _: ["rss", "https://github.com/danmactough/node-feedparser/raw/master/test/feeds/rss2sample.xml"] });
			setTimeout(function () {
				fakeHexo.setValues.receivedPosts.length.should.be.gt(0);
				should.not.exist(fakeHexo.setValues.receivedPosts[0].alias);
				done();
			}, 500);
		});
	});

	context("passed source with alias flag", function () {
		it("creates posts with alias", function (done) {
			fakeHexo.call("migrate", { _: ["rss", "https://github.com/danmactough/node-feedparser/raw/master/test/feeds/rss2sample.xml"], alias: true });
			setTimeout(function () {
				fakeHexo.setValues.receivedPosts.length.should.be.gt(0);
				should.exist(fakeHexo.setValues.receivedPosts[0].alias, "alias missing");
				done();
			}, 500);
		});
	});	
});

