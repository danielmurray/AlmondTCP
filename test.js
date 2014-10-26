var watchTree = require("fs-watch-tree").watchTree;

var watch = watchTree("almondRootDir", function (event) {
	console.log('fs-watch-tree')
});
