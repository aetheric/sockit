/* globals module, define, sessionStorage */

var _ = require('underscore');
var WebSocket = require('ws');
var diff = require('deep-diff');

var Update = require('../proto/update.proto.js');

(function(root){

	function init() {
		return function(window) {
			var self = this;

			var root = window || root;

			self.session = root.sessionStorage;
			self.previous = {};

			self.socket = new WebSocket(root.location.replace('^http', 'ws'));

			self.socket.on('message', function(message) {

				// Decode the incoming message.
				var changes = new Update().decode64(message).toRaw();

				// Apply the received changes to the session storage.
				diff.applyChanges(self.previous, self.session, changes);

				self.previous = _.clone(self.session);

			});

			root.on('storage', function() {

				var changes = diff.diff(self.previous, self.session);
				if (!(changes && changes.length)) {
					return;
				}

				var payload = new Update(changes).encode().toBase64();

				self.socket.emit(payload);

				self.previous = _.clone(self.session);

			});

		}
	}

	if (typeof(module) !== 'undefined') {
		module.exports = init();
	} else if (typeof(define) !== 'undefined') {
		define('session-synch', [
		], init);
	}

})(this);
