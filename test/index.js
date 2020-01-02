'use strict';

require('chai').should();
const { join } = require('path');
const { exists, rmdir } = require('hexo-fs');
const Hexo = require('hexo');
const hexo = new Hexo(__dirname);
const m = require('../lib/migrator.js').bind(hexo);

describe('migrator', function() {
  this.timeout(5000);

  before(() => hexo.init());

  it('default - file', async () => {
    await m({ _: [join(__dirname, 'fixtures/rss.xml')] });
    const exist = await exists(join(hexo.source_dir, '_posts', 'Star-City.md'));
    exist.should.eql(true);

    await rmdir(hexo.source_dir);
  });

  it('default - url', async () => {
    await m({ _: ['https://github.com/danmactough/node-feedparser/raw/master/test/feeds/rss2sample.xml'] });
    const exist = await exists(join(hexo.source_dir, '_posts', 'The-Engine-That-Does-More.md'));
    exist.should.eql(true);

    await rmdir(hexo.source_dir);
  });

  it('no argument', async () => {
    try {
      await m({ _: [''] });
    } catch (err) {
      err.message.split('\n')[0].should.eql('Usage: hexo migrate rss <source> [--alias]');
    }
  });

  it('invalid url', async () => {
    const url = 'http://does.not.exist/';
    try {
      await m({ _: [url] });
    } catch (err) {
      err.message.includes('RequestError:').should.eql(true);
    }
  });

  it('invalid path', async () => {
    const path = 'does/not/exist';
    try {
      await m({ _: [path] });
    } catch (err) {
      err.message.includes('Error: ENOENT: no such file or directory').should.eql(true);
    }
  });
});
