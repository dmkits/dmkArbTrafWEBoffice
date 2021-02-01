define([
	"dojo/_base/lang",
	"../_base",
	"../utils/date"
], function(lang,dd,ddud){

	var date = lang.getObject("tag.date", true, dd);
	/*=====
	 date = {
	 	// TODO: summary
	 };
	 =====*/

	date.NowNode = function(format, node){
		this._format = format;
		this.format = new ddud.DateFormat(format);
		this.contents = node;
	};
	lang.extend(date.NowNode, {
		render: function(context, buffer){
			this.contents.set(this.format.format(new Date()));
			return this.contents.render(context, buffer);
		},
		unrender: function(context, buffer){
			return this.contents.unrender(context, buffer);
		},
		clone: function(buffer){
			return new this.constructor(this._format, this.contents.clone(buffer));
		}
	});

	date.now = function(parser, token){
		// Split by either :" or :'
		var parts = token.split_contents();
		if(parts.length != 2){
			throw new Error("'now' statement takes one argument");
		}
		return new date.NowNode(parts[1].slice(1, -1), parser.create_text_node());
	};

	return date;
});