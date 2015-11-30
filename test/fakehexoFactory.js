// Return mock hexo for unit testing.
exports.create = function () {
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
	mock.extend.migrator.register = function (type, f) {
		mock.setValues.registeredType = type;
		mock.setValues.callback = f;
	};
	mock.call = function (type, args) {
		mock.setValues.calledType = args._.shift();
		mock.setValues.callback(args, function () { });		
	};
	mock.log = {
		i: function () { },
		w: function () { }
	};
	mock.post = {
		create: function (newPost) {
			mock.setValues.receivedPosts.push(newPost);
		}
	};
	return mock;
};