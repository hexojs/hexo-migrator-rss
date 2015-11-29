'use strict';

var should = require('chai').should(),
	ctx = {
		hexo : (function() {
			var mock = {}; 
			mock.setValues = 
			{	
				registeredType: null, 
				receivedPosts: [],
				callback: null,
				calledType: null
			};
			mock.extend = {};
			mock.extend.migrator = {};
			mock.extend.migrator.register = function(type, f) {
				mock.setValues.registeredType = type;
				mock.setValues.callback = f;
			};
			mock.call =  function(type, args) {
				mock.setValues.calledType = args._.shift();
				//replicate hexo logic to move flags
				var newArgs = {_: []}
				if (args._.length > 0)
				{
					newArgs._.push(args._.shift());
				} 		
				mock.setValues.callback(newArgs, function(){});
				
			};
			mock.log = {
				i: function() {},
				w: function() {}				
			};
			mock.post = {
				create : function(newPost) {
					mock.setValues.receivedPosts.push(newPost);
				}
			};
			return mock;
		})()
	};


describe("migrator rss", function() {
      this.timeout(10000);
	beforeEach(function() {  
		GLOBAL.hexo = ctx.hexo;
		require("../index.js");
	});
	
	it("registers \"rss\" to hexo", function()
	{
	   ctx.hexo.setValues.registeredType.should.equal("rss");
	});
 
    context("called with \"rss\"", function()
	{
		it("parameter passed through", function() {
			ctx.hexo.call("migrate", {_:["rss"]});
			ctx.hexo.setValues.calledType.should.equal("rss");
		})
	   
	});
 	context("passed source", function() {
		it("creates posts", function(done) {
			ctx.hexo.call("migrate", {_:["rss", "https://github.com/danmactough/node-feedparser/raw/master/test/feeds/rss2sample.xml"]});
			ctx.hexo.setValues.receivedPosts.length.should.be.gt(0);
	 		done();	  
		});
	});	
	
	// context("passed --alias option", function() {
	// 	it("adds alias", function(done) {
	// 		ctx.hexo.call("migrate", {_:["rss", "https://github.com/danmactough/node-feedparser/raw/master/test/feeds/rss2sample.xml", "--alias"]});
	// 		ctx.hexo.setValues.receivedPosts[0].alias.should.exists();
	//  		done();	  
	// 	});
	// });	
});

