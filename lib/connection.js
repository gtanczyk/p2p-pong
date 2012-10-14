window["Connection"] = dojo.declare("Connection", null, {
	onListeners : [],

	constructor : function(args) {
		dojo.safeMixin(this, args);
		this.socket = new WebSocket(this.socketURL);

		this.socket.onopen = dojo.hitch(this, function() {

		});

		this.socket.onmessage = dojo.hitch(this, function(event) {
			var header = event.data.substring(0, event.data.indexOf(':'));
			var body = event.data.substring(event.data.indexOf(':') + 1);
			this.receive(header, body, event.data);
		});

		this.on(/^(host|client)$/, dojo.hitch(this, function(header, body) {
			if (header == 'host')
				this.isHost = true;
			if (header == 'client')
				this.clientID = body;
		}));
	},
	receive : function(header, body, data) {
		this.onListeners.every(function(listener) {
			if (header.match(listener.filter))
				listener.callback(header, body, data);
			return true;
		})
	},
	on : function(filter, callback) {
		this.onListeners.push({
			filter : filter,
			callback : callback
		});
	},
	hon : function(filter, callback) {
		this.onListeners.push({
			filter : /^(\d+)$/,
			callback : function(header, body, data) {
				var clientID = header;
				var header = body.substring(0, body.indexOf(':'));
				if (!header.match(filter))
					return;
				var body = body.substring(body.indexOf(':') + 1);
				callback(header, body, data, clientID);
			}
		});
	},
	broadcast : function(header, body, callback) {
		if (this.isHost)
			this.socket.send("*:" + header + ":" + (body || ''));
	},
	toHost : function(header, body, callback) {
		if (this.isHost)
			this.receive(this.clientID, header + ":" + (body || ''));
		else
			this.socket.send("host:" + header + ":" + (body || ''));
	},
	toClient : function(clientID, header, body, callback) {
		if (this.isHost)
			this.socket.send(clientID + ":" + header + ":" + (body || ''));
	},
});