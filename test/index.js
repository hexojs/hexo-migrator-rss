'use strict';

var should = require('chai').should(); // eslint-disable-line
const migrator = require('../lib/migrator.js');
const fakehexoFactory = require('./fakehexoFactory.js');
let fakeHexo;

describe('migrator', function() {

  this.timeout(10000);

  beforeEach(() => {
    fakeHexo = fakehexoFactory.create();
    migrator.registerMigrator(fakeHexo);
  });

  it('registers rss', () => {
    fakeHexo.setValues.registeredType.should.equal('rss');
  });

  context('called with "rss"', () => {
    it('passes parameter through', done => {
      fakeHexo.call('migrate', { _: ['rss'] }, err => {
        if (err) throw err;
        fakeHexo.setValues.calledType.should.equal('rss');
        done();
      });
    });
  });

  context('local file', () => {
    it('creates posts using a local RSS file', done => {
      fakeHexo.call('migrate', { _: ['rss', './test/fixtures/rss.xml'] },
        err => {
          if (err) throw err;
          fakeHexo.setValues.receivedPosts.length.should.be.gt(0);
          done();
        });
    });
  });

  context('No description', () => {
    it('a post with empty description', done => {
      fakeHexo.call('migrate', { _: ['rss', './test/fixtures/rss.xml'] },
        err => {
          if (err) throw err;
          fakeHexo.setValues.receivedPosts[0].content.should.equal('');
          done();
        });
    });
  });

  context('alias flag not passed', () => {
    it('creates posts without alias field', done => {
      fakeHexo.call('migrate', { _: ['rss', 'https://github.com/danmactough/node-feedparser/raw/master/test/feeds/rss2sample.xml'] },
        err => {
          if (err) throw err;
          fakeHexo.setValues.receivedPosts.length.should.be.gt(0);
          should.not.exist(fakeHexo.setValues.receivedPosts[0].alias);
          done();
        });
    });
  });

  context('alias flag passed', () => {
    it('creates posts with alias field', done => {
      fakeHexo.call('migrate', { _: ['rss', 'https://github.com/danmactough/node-feedparser/raw/master/test/feeds/rss2sample.xml'], alias: true },
        err => {
          if (err) throw err;
          fakeHexo.setValues.receivedPosts.length.should.be.gt(0);
          should.exist(fakeHexo.setValues.receivedPosts[0].alias, 'alias missing');
          done();
        });
    });
  });
});

