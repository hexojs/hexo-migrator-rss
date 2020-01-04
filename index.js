/* global hexo */
'use strict';

hexo.extend.migrator.register('rss', require('./lib/migrator'));
