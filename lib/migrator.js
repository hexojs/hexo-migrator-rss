'use strict';

const FeedParser = require('feedparser');
const async = require('async');
const TurndownService = require('turndown');
const request = require('request');
const url = require('url');
const fs = require('fs');

exports.registerMigrator = function(hexo) {
  hexo.extend.migrator.register('rss', (args, callback) => {
    const source = args._.shift();
    const tomd = new TurndownService();

    if (!source) {
      const help = [
        'Usage: hexo migrate rss <source> [--alias]',
        '',
        'For more help, you can check the docs: http://hexo.io/docs/migration.html'
      ];

      console.log(help.join('\n'));
      return callback();
    }

    const log = hexo.log;
    const post = hexo.post;
    let untitledPostCounter = 0;
    let stream;

    // URL regular expression from: http://blog.mattheworiordan.com/post/13174566389/url-regular-expression-for-links-with-or-without-the
    if (source.match(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[.!/\\w]*))?)/)) {
      stream = request(source);
    } else {
      stream = fs.createReadStream(source);
    }

    log.i('Analyzing %s...', source);

    const feedparser = new FeedParser();
    const posts = [];

    stream.pipe(feedparser)
      .on('error', callback);

    feedparser.on('error', callback);

    feedparser.on('readable', function() {
      const stream = this;
      let item;

      while (item = stream.read()) { // eslint-disable-line

        if (!item.title) {
          untitledPostCounter += 1;
          const untitledPostTitle = 'Untitled Post - ' + untitledPostCounter;
          item.title = untitledPostTitle;
          log.w('Post found but without any titles. Using %s', untitledPostTitle);
        } else {
          log.i('Post found: %s', item.title);
        }

        const newPost = {
          title: item.title,
          date: item.date,
          tags: item.categories,
          content: tomd.turndown(item.description || '')
        };

        if (args.alias) {
          newPost.alias = url.parse(item.link).pathname;
        }

        posts.push(newPost);

      }
    });

    stream.on('end', () => {
      async.each(posts, (item, next) => {
        post.create(item, next);
      }, err => {
        if (err) return callback(err);

        log.w('%d posts did not have titles and were prefixed with "Untitled Post".', untitledPostCounter);
        log.i('%d posts migrated.', posts.length);
        callback();
      });
    });
  });
};
