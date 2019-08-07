# hexo-migrator-rss

[![Build Status](https://travis-ci.org/hexojs/hexo-migrator-rss.svg?branch=master)](https://travis-ci.org/hexojs/hexo-migrator-rss)
[![NPM version](https://badge.fury.io/js/hexo-migrator-rss.svg)](https://www.npmjs.com/package/hexo-migrator-rss)

Migrate your blog from RSS to [Hexo].

## Install

``` bash
$ npm install hexo-migrator-rss --save
```

## Usage

Execute the following command after installed. `source` is the file path or URL of RSS.  

The `--alias` option populates the `alias` setting in the front-matter, for use with the [hexo-generator-alias](http://github.com/hexojs/hexo-generator-alias) module. This is useful
for generating redirects.

``` bash
$ hexo migrate rss <source> [--alias]
```

[Hexo]: http://zespia.tw/hexo
