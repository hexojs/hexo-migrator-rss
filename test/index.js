'use strict';

require('chai').should();
const { join } = require('path');
const { exists, listDir, readFile, rmdir, unlink, writeFile } = require('hexo-fs');
const { slugize, escapeHTML, unescapeHTML } = require('hexo-util');
const TurndownService = require('turndown');
const tomd = new TurndownService();
const Hexo = require('hexo');
const hexo = new Hexo(process.cwd(), { silent: true });
const m = require('../lib/migrator.js').bind(hexo);
const parseFeed = require('../lib/feed');
const { spy } = require('sinon');
const log = spy(hexo.log);

const md = str => {
  return tomd.turndown(str);
};

describe('migrator', function() {
  this.timeout(5000);

  before(() => hexo.init());

  afterEach(async () => {
    const exist = await exists(hexo.source_dir);
    if (exist) await rmdir(hexo.source_dir);
  });

  it('default - file', async () => {
    await m({ _: [join(__dirname, 'fixtures/rss.xml')] });
    const exist = await exists(join(hexo.source_dir, '_posts', 'Star-City.md'));

    exist.should.eql(true);
  });

  it('unicode', async () => {
    await m({ _: [join(__dirname, 'fixtures/atom.xml')] });
    const exist = await exists(join(hexo.source_dir, '_posts', '静夜思.md'));

    exist.should.eql(true);
  });

  it('default - logging', async () => {
    const path = join(__dirname, 'fixtures/rss.xml');
    await m({ _: [path] });

    const input = await readFile(path);
    const { items } = await parseFeed(input);

    const { firstCall, lastCall } = log.i;

    firstCall.calledWith('Analyzing %s...', path).should.eql(true);
    lastCall.calledWith('%d posts migrated.', items.length).should.eql(true);
  });

  it('default - logging (untitled post)', async () => {
    const path = join(__dirname, 'fixtures/rss.xml');
    await m({ _: [path] });

    log.w.calledWith('%d posts did not have titles and were prefixed with "Untitled Post".', 1).should.eql(true);
  });

  it('default - url', async () => {
    await m({ _: ['https://github.com/danmactough/node-feedparser/raw/master/test/feeds/rss2sample.xml'] });
    const exist = await exists(join(hexo.source_dir, '_posts', 'The-Engine-That-Does-More.md'));

    exist.should.eql(true);
  });

  it('default - atom', async () => {
    await m({ _: [join(__dirname, 'fixtures/atom.xml')] });
    const exist = await exists(join(hexo.source_dir, '_posts', 'Star-City.md'));

    exist.should.eql(true);
  });

  it('title with double quotes', async () => {
    const title = 'lorem "ipsum"';
    const xml = `<feed><title>test</title><entry><title>${title}</title></entry></feed>`;
    const path = join(__dirname, 'atom-test.xml');
    await writeFile(path, xml);
    await m({ _: [path] });

    const post = await readFile(join(hexo.source_dir, '_posts', slugize(title) + '.md'));
    post.includes('title: ' + title).should.eql(true);

    await unlink(path);
  });

  it('title with double quotes and semicolon', async () => {
    const title = 'lorem: "ipsum"';
    const xml = `<feed><title>test</title><entry><title>${title}</title></entry></feed>`;
    const path = join(__dirname, 'atom-test.xml');
    await writeFile(path, xml);
    await m({ _: [path] });

    const post = await readFile(join(hexo.source_dir, '_posts', slugize(title) + '.md'));
    post.includes('title: \'' + title + '\'').should.eql(true);

    await unlink(path);
  });

  it('title with escaped character', async () => {
    const title = 'lorem & "ipsum"';
    const xml = `<feed><title>test</title><entry><title>${escapeHTML(title)}</title></entry></feed>`;
    const path = join(__dirname, 'atom-test.xml');
    await writeFile(path, xml);
    await m({ _: [path] });

    const post = await readFile(join(hexo.source_dir, '_posts', slugize(title) + '.md'));
    post.includes('title: ' + title).should.eql(true);

    await unlink(path);
  });

  describe('excerpt', () => {
    const atom = (content = '', summary = '') => {
      return `<feed><title>test</title>
      <entry><title>test</title><content type="html"><![CDATA[${content}]]></content>
      <summary type="html">${summary}</summary></entry></feed>`;
    };

    // Extract a post's content excluding front-matter
    // https://github.com/hexojs/hexo-front-matter
    const parsePost = post => {
      const rFrontMatter = /^([\s\S]+?)\n(-{3,}|;{3,})(?:$|\n([\s\S]*)$)/;

      return post.match(rFrontMatter)[3].replace(/\r?\n|\r/g, '');
    };

    it('summary element', async () => {
      const summary = '&lt;p&gt;&lt;em&gt;foo&lt;/em&gt;&lt;/p&gt;';
      const content = 'foo';
      const xml = atom(content, summary);
      const path = join(__dirname, 'atom-test.xml');
      await writeFile(path, xml);
      await m({ _: [path] });

      const html = unescapeHTML(summary);
      const markdown = md(html);

      const post = await readFile(join(hexo.source_dir, '_posts', 'test.md'));
      const output = parsePost(post);

      output.should.eql(markdown + '<!-- more -->' + content);

      await unlink(path);
    });

    it('duplicate excerpts', async () => {
      const summary = '&lt;p&gt;&lt;em&gt;foo&lt;/em&gt;&lt;/p&gt;';
      const content = 'foo';
      const postContent = `${unescapeHTML(summary)}<a id="more"></a>${content}`;
      const xml = atom(postContent, summary);
      const path = join(__dirname, 'atom-test.xml');
      await writeFile(path, xml);
      await m({ _: [path] });

      const html = unescapeHTML(summary);
      const markdown = md(html);

      const post = await readFile(join(hexo.source_dir, '_posts', 'test.md'));
      const output = parsePost(post);

      output.should.eql(markdown + '<!-- more -->' + content);

      await unlink(path);
    });

    it('excerpt - "more" tag', async () => {
      const excerpt = 'f<em>o</em>o';
      const moreTag = '<!-- more -->';
      const content = 'b<em>a</em>r';
      const postContent = excerpt + moreTag + content;
      const xml = atom(postContent, '');
      const path = join(__dirname, 'atom-test.xml');
      await writeFile(path, xml);
      await m({ _: [path] });

      const post = await readFile(join(hexo.source_dir, '_posts', 'test.md'));
      const output = parsePost(post);

      output.should.eql(md(excerpt) + moreTag + md(content));

      await unlink(path);
    });
  });

  it('no argument', async () => {
    try {
      await m({ _: [''] });
    } catch (err) {
      err.message.split('\n')[0].should.eql('Usage: hexo migrate rss <source> [--alias]');
    }
  });

  it('invalid url', async () => {
    const url = 'http://foo.invalid/';
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

  it('option - limit', async () => {
    const path = join(__dirname, 'fixtures/rss.xml');
    const limit = 2;
    await m({ _: [path], limit });
    const posts = await listDir(join(hexo.source_dir, '_posts'));
    posts.length.should.eql(limit);

    const input = await readFile(path);
    const expected = await parseFeed(input);

    // should follow order from top to bottom
    for (let i = 0; i < limit; i++) {
      const filename = expected.items[i].title.replace(/ /g, '-') + '.md';
      posts[i].should.eql(filename);
    }
  });

  it('option - invalid limit', async () => {
    const path = join(__dirname, 'fixtures/rss.xml');
    const limit = 9000;
    await m({ _: [path], limit });
    const posts = await listDir(join(hexo.source_dir, '_posts'));
    const input = await readFile(path);
    const expected = await parseFeed(input);

    posts.length.should.eql(expected.items.length);
  });

  it('option - skipduplicate', async () => {
    const path = join(__dirname, 'fixtures/atom.xml');
    const postDir = join(hexo.source_dir, '_posts');
    await writeFile(join(postDir, 'Star-City.md'), 'foo');
    await m({ _: [path], skipduplicate: true });
    const posts = await listDir(postDir);
    const input = await readFile(path);
    const expected = await parseFeed(input);

    posts.length.should.eql(expected.items.length);
  });

  it('option - skipduplicate (no existing post)', async () => {
    const path = join(__dirname, 'fixtures/atom.xml');
    const postDir = join(hexo.source_dir, '_posts');
    await m({ _: [path], skipduplicate: true });
    const posts = await listDir(postDir);
    const input = await readFile(path);
    const expected = await parseFeed(input);

    posts.length.should.eql(expected.items.length);
  });

  it('option - skipduplicate disabled', async () => {
    const path = join(__dirname, 'fixtures/atom.xml');
    const postDir = join(hexo.source_dir, '_posts');
    await writeFile(join(postDir, 'Star-City.md'), 'foo');
    await m({ _: [path] });
    const posts = await listDir(postDir);
    const input = await readFile(path);
    const expected = await parseFeed(input);

    posts.length.should.not.eql(expected.items.length);
  });

  // hexojs/hexo-migrator-wordpress#105
  it('sanitize input', async () => {
    const title = 'foo';
    const content = 'foo\x00\x11bar';
    const xml = `<feed><title>test</title>
    <entry><title>${title}</title><content>${content}</content></entry></feed>`;
    const path = join(__dirname, 'atom-test.xml');
    await writeFile(path, xml);
    await m({ _: [path] });

    const post = await readFile(join(hexo.source_dir, '_posts', slugize(title) + '.md'));
    post.should.include('foobar');

    await unlink(path);
  });
});
