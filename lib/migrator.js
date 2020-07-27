'use strict';

const TurndownService = require('turndown');
const got = require('got');
const { parse: parseUrl } = require('url');
const { exists, listDir, readFile } = require('hexo-fs');
const parseFeed = require('./feed');
const { slugize, unescapeHTML } = require('hexo-util');
const { join, parse } = require('path');

module.exports = async function(args) {
  const source = args._.shift();
  const { alias } = args;
  const skipduplicate = Object.prototype.hasOwnProperty.call(args, 'skipduplicate');
  let { limit } = args;
  const tomd = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
  const { config, log } = this;
  const Post = this.post;
  let untitledPostCounter = 0;
  let errNum = 0;
  let skipNum = 0;
  let input, feed;
  const tagExcerpt = '<a id="more"></a>';
  const rExcerpt = /<!-- ?more ?-->/i;
  const postExcerpt = '\n<!-- more -->\n';
  const rEntity = /&#?\w{2,4};/;
  const posts = [];
  let currentPosts = [];

  const md = str => {
    return tomd.turndown(str);
  };

  try {
    if (!source) {
      const help = [
        'Usage: hexo migrate rss <source> [--alias]',
        '',
        'For more help, you can check the docs: http://hexo.io/docs/migration.html'
      ];

      throw help.join('\n');
    }

    if (/^http(s)?:\/\//i.test(source)) {
      input = await got(source, { resolveBodyOnly: true, retry: 0 });
    } else {
      input = await readFile(source);
    }

    log.i('Analyzing %s...', source);

    feed = await parseFeed(input);
  } catch (err) {
    throw new Error(err);
  }

  if (feed) {
    if (typeof limit !== 'number' || limit > feed.items.length || limit <= 0) limit = feed.items.length;

    for (let i = 0; i < limit; i++) {
      const item = feed.items[i];
      const { date, tags, link } = item;
      let { content, excerpt, title } = item;

      if (excerpt) {
        if (rEntity.test(excerpt)) excerpt = unescapeHTML(excerpt);
        if (content.includes(excerpt)) content = content.replace(excerpt, '');
        if (content.includes(tagExcerpt)) content = content.replace(tagExcerpt, '');

        content = md(excerpt) + postExcerpt + md(content);
      } else if (rExcerpt.test(content)) {
        content.replace(rExcerpt, (match, index) => {
          const excerpt = content.substring(0, index).trim();
          const more = content.substring(index + match.length).trim();

          content = md(excerpt) + postExcerpt + md(more);
        });
      } else {
        content = md(content);
      }

      if (!title) {
        untitledPostCounter += 1;
        const untitledPostTitle = 'Untitled Post - ' + untitledPostCounter;
        title = untitledPostTitle;
        log.w('Post found but without any titles. Using %s', untitledPostTitle);
      } else {
        log.i('Post found: %s', title);
      }

      if (rEntity.test(title)) title = unescapeHTML(title);
      if (title.includes('"')) title = title.replace(/"/g, '\\"');

      const newPost = {
        title,
        date,
        tags,
        excerpt,
        content
      };

      if (alias && link) {
        newPost.alias = parseUrl(link).pathname;
      }

      posts.push(newPost);
    }
  }

  if (skipduplicate) {
    const postFolder = join(config.source_dir, '_posts');
    const folderExist = await exists(postFolder);
    const files = folderExist ? await listDir(join(config.source_dir, '_posts')) : [];
    currentPosts = files.map(file => slugize(parse(file).name, { transform: 1 }));
  }

  if (posts.length >= 1) {
    for (const post of posts) {
      if (currentPosts.length && skipduplicate) {
        if (currentPosts.includes(slugize(post.title, { transform: 1 }))) {
          skipNum++;
          continue;
        }
      }
      try {
        await Post.create(post);
      } catch (err) {
        log.error(err);
        errNum++;
      }
    }

    const postsNum = posts.length - errNum - skipNum;
    if (untitledPostCounter) {
      log.w('%d posts did not have titles and were prefixed with "Untitled Post".', untitledPostCounter);
    }
    if (postsNum) log.i('%d posts migrated.', postsNum);
    if (errNum) log.error('%d posts failed to migrate.', errNum);
    if (skipNum) log.i('%d posts skipped.', skipNum);
  }
};

