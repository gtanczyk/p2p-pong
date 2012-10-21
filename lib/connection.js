window["Connection"] = dojo.declare("Connection", null, {
	onListeners : [],

	constructor : function(args) {
		dojo.safeMixin(this, args);
		this.socket = new WebSocket(this.socketURL);

		this.socket.onopen = dojo.hitch(this, function() {

		});

		this.socket.onerror = this.socket.onclose = dojo.hitch(this, function() {
			if (!this.clientID) { // init local host mode
				console.log('Server connection failed, entering offline mode');
				this.receive("client", "local");
				this.receive("host", "true");
			}
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
		if (this.isHost) {
			try {
				this.socket.send("*:" + header + ":" + (body || ''));
			} catch (e) {
				this.socket.onclose();
			}
			setTimeout(function() {
				this.receive(header, body);
			}.bind(this), 0)
		}
	},
	toHost : function(header, body, callback) {
		if (this.isHost)
			setTimeout(function() {
				this.receive(this.clientID, header + ":" + (body || ''));
			}.bind(this), 0);
		else
			try {
				this.socket.send("host:" + header + ":" + (body || ''));
			} catch (e) {
				this.socket.onclose();
			}
	},
	toClient : function(clientID, header, body, callback) {
		if (this.isHost)
			if (clientID == this.clientID)
				setTimeout(function() {
					this.receive(header, body);
				}.bind(this), 0);
			else
				try {
					this.socket.send(clientID + ":" + header + ":" + (body || ''));
				} catch (e) {
					this.socket.onclose();
				}
	},
});