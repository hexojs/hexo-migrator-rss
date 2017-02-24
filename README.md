# RSS migrator

Migrate your blog from RSS to [Hexo].

## Install

``` bash
$ npm install hexo-migrator-rss --save
```

## Usage

Execute the following command after installed. `source` is the file path or URL of RSS.

``` bash
$ hexo migrate rss <source> [OPTIONS]
```

### OPTIONS
```
--alias 	Populates the `alias` setting in the front-matter, 
			for use with the [hexo-generator-alias](http://github.com/hexojs/hexo-generator-alias) module. 
			This is useful for generating redirects.
--limit 	Limits the number of posts migrated to your blog. 
			Takes integer value (limit 3)
```

[Hexo]: http://zespia.tw/hexo
