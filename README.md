# hexo-migrator-rss

[![Build Status](https://travis-ci.org/hexojs/hexo-migrator-rss.svg?branch=master)](https://travis-ci.org/hexojs/hexo-migrator-rss)
[![NPM version](https://badge.fury.io/js/hexo-migrator-rss.svg)](https://www.npmjs.com/package/hexo-migrator-rss)

Migrate your blog from Atom/RSS to [Hexo].

## Install

``` bash
$ npm install hexo-migrator-rss --save
```

## Usage

Execute the following command after installed. `source` is the file path or URL of Atom/RSS.

``` bash
$ hexo migrate rss <source> [--options]
```

- **alias**: Populates the `alias` setting in the front-matter, for use with the [hexo-generator-alias](http://github.com/hexojs/hexo-generator-alias) module. This is useful for generating redirects.
- **limit**: Maximum number of posts to import from the feed. All posts are imported by default.
  * Example:
  ``` bash
  $ hexo migrate rss /path/atom.xml --limit 3
  ```
- **skipduplicate**: Skip posts with similar title as existing ones.
  * If a feed contains a post titled 'Foo Bar' and there is an existing post named 'Foo-Bar.md', then that post will not be migrated.
  * The comparison is case-insensitive; a post titled 'FOO BAR' will be skipped if 'foo-bar.md' exists.
  * Without this option (default), this plugin will continue to migrate that post and create a post named 'Foo-Bar-1.md'

[Hexo]: https://hexo.io/
