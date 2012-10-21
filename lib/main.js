dojo.require("dojo.dnd.move");

dojo.ready(function() {
	var n = 5;
	var width = 300;
	var radius = width / Math.sqrt(Math.pow(Math.tan(Math.PI / n), 2) + 1);

	var system, edges, balls = [];

	var plane = window.plane = dojo.create('canvas', {
		className : 'plane',
		width : radius * 2,
		height : radius * 2,
		style : {
			width : radius * 2 + 'px',
			height : radius * 2 + 'px',
			marginLeft : -radius + 'px',
			marginTop : -radius + 'px'
		}
	}, dojo.body(), 'first');

	var slots = [];
	for ( var i = 0; i < n; i++)
		slots.push(i);
	slots.sort(function() {
		return Math.random() - Math.random();
	});

	var slotMap = {};

	var slotReg = {};

	var slotOffset = {};

	var connection = new Connection({
		socketURL : "ws://" + (document.location.hostname || 'localhost') + ":10123"
	});

	// debug
	connection.on(/(.*)/, function() {
		// console.log("debug:", arguments)
	});

	/* basic communiction */

	// send greeting to server
	connection.on("client", function(header, body, data) {
		connection.toHost("hello");
	});

	connection.on("host", function(header, body, data) {
		if (!system)
			connection.broadcast("mdinit");
	});

	// greeting, client asks for game state
	connection.hon("hello", function(header, body, data, clientID) {
		for ( var i in slotReg)
			connection.toClient(clientID, "regslot", slotReg[i] + ":" + i + ":" + slotMap[slotReg[i]].name);
		cloneGame(clientID);
	});

	// ping/pong
	connection.hon("ping", function(header, body, data, clientID) {
		connection.toClient(clientID, "pong", [new Date().getTime(), system.T, body, startTS].join(':'));
	});

	setInterval(function() {
		connection.toHost("ping", new Date().getTime());
	}, 1000);

	connection.on("pong", function(header, body, data) {
		body = body.split(':').map(parseFloat);
		system.T = body[1];
		startDTS = startTS - body[3];
	});

	/* box */

	connection.hon("boxleft", function(header, body, data, clientID) {
		var slot = slotReg[clientID];
		if (slot && slotOffset[slot] != null)
			connection.broadcast("boxleft", slot + ":" + body);
	})

	connection.on("boxleft", function(header, body) {
		body = body.split(':');
		var slot = body[0];
		if (slotOffset[slot] != null) {
			var boxLeft = parseInt(body[1]);
			slotOffset[slot] = boxLeft;
		}
	});

	/* slot management */

	// new player asks for a slot
	connection.hon("myslot", function(header, body, data, clientID) {
		var slot = slots.pop();
		if (slot) {
			connection.broadcast("regslot", slot + ":" + clientID + ":" + body);
			connection.toClient(clientID, "yourslot", slot);
		}
	});

	// response to myslot, hosts assign slot id, create new box or gran the old
	// one
	connection.on("yourslot", function(header, body, data, clientID) {
		var slot = parseInt(body);
		// myBox = dojo.query('>.box', edges[slot])[0] || dojo.create('div', {
		// className : 'box'
		// }, edges[slot], 'first');
	})

	// player disconnected, broadcast this information to all clients
	connection.hon("leave", function(header, body, data, clientID) {
		if (slotReg[clientID])
			connection.broadcast("leaveslot", slotReg[clientID] + ":" + clientID);
	});

	// information from host about new player taking some spot
	connection.on("regslot", function(header, body, data) {
		body = body.split(':');
		var slot = parseInt(body[0]);
		var clientID = parseInt(body[1]);
		var name = body[2];
		slotMap[slot] = {
			name : name
		};
		slotReg[clientID] = slot;

		slotOffset[slot] = 0;

		// dojo.query('>.status>input', edges[slot]).filter(function(input) {
		// input.value = name;
		// })
		//
		// dojo.create('div', {
		// className : 'box'
		// }, edges[slot], 'first');

		if (slots.indexOf(slot) >= 0)
			slots.splice(slots.indexOf(slot), 1);
	})

	// information from host about
	connection.on("leaveslot", function(header, body, data) {
		var body = body.split(':');
		var slot = parseInt(body[0]);
		var clientID = parseInt(body[1]);
		if (!slotReg[clientID])
			return;
		slots.push(slotReg[clientID]);
		delete slotMap[slotReg[clientID]];
		delete slotOffset[slotReg[clientID]];
		delete slotReg[clientID];
	});

	/* model communication */

	// init model
	connection.on("mdinit", function(header, body, data) {
		initGame(parseInt(body));
	});

	// init/update edge
	connection.on("mdedge", function(header, body, data) {
		var body = body.split(':').map(parseFloat);
		if (!system.edges[body[4]])
			new model.Edge(system, {
				A : [body[0], body[1]],
				B : [body[2], body[3]],
				ID : body[4]
			})
	});

	// init/update ball
	connection.on("mdball", function(header, body, data) {
		var body = body.split(':').map(parseFloat);
		var ball;
		if (!(ball = system.balls[body[5]]))
			ball = new model.Ball(system, {
				P : [body[0], body[1]],
				V : [body[2], body[3]],
				R : body[4],
				ID : body[5],
				onUpdate : function(T, P, V) {
					connection.broadcast("mdball", [].concat(P, V, body[4], body[5], T).join(':'))
				}
			});

		var T = body[6];
		ball.updatePosition(T, [body[0], body[1]], true);
		ball.updateVelocity(T, [body[2], body[3]], true);
	});

	/* game world init (as host) */
	function initGame(T) {
		system = new model.System({
			T : T
		});
		system.onCollision(function(T, objects) {
			if (objects.length == 2 && objects[0].declaredClass == 'model.Ball' && objects[1].declaredClass == 'model.Edge') {
				var offset = VMath.distance(objects[1].B, VMath.add(objects[0].getPosition(T), VMath.scale(objects[1].N, objects[0].R)));
				for ( var i in slotOffset)
					if ((4 - i) % n == objects[1].ID) {
						if ((Math.abs(offset - slotOffset[i] + 50) < 50))
							console.log(objects[1].ID, Math.abs(offset - slotOffset[i] + 50));
					}
			}
		});
		for ( var i = 0; i < n; i++)
			connection.broadcast("mdedge",
			// A
			[Math.cos(2 * Math.PI / n * (i)) * radius, Math.sin(2 * Math.PI / n * (i)) * radius,
			// B
			Math.cos(2 * Math.PI / n * (i + 1)) * radius, Math.sin(2 * Math.PI / n * (i + 1)) * radius, i].join(':'));

		for ( var i = 0; i < n; i++)
			connection.broadcast("mdball",
			// P
			[Math.cos(2 * Math.PI / (n) * (i + 0.5)) * radius / 2, Math.sin(2 * Math.PI / (n) * (i + 0.5)) * radius / 2,
			// V
			150 * Math.cos(2 * Math.PI / (n) * (i - 0.5 + Math.random())), 150 * Math.sin(2 * Math.PI / (n) * (i - 0.5 + Math.random())),
			// R
			4 + Math.random() * 5,
			// ID,
			i,
			// T
			0].join(':'));
	}

	/* game world clone (as client) */
	function cloneGame(clientID) {
		connection.toClient(clientID, 'mdinit', system.T);
		system.edges.every(function(edge) {
			connection.toClient(clientID, "mdedge", [].concat(edge.A, edge.B, edge.ID).join(':'))
			return true;
		})

		system.balls.every(function(ball) {
			connection.toClient(clientID, "mdball", [].concat(ball.P, ball.V, ball.R, ball.ID, system.T).join(':'))
			return true;
		})
	}

	/* rendering stuff */

	var context = plane.getContext('2d');
	var startTS = lastTS = new Date().getTime();
	var startDTS = 0;
	var dirty = [];
	function render() {
		setTimeout(function() {
			window.requestAnimationFrame(render);
		}, 0);

		if (!system)
			return;

		system.doStep((new Date().getTime() - lastTS) / 1000);

		var T = Math.min((new Date().getTime() - startTS + startDTS) / 1000, system.T);

		dirty = dirty.filter(function(P) {
			context.clearRect(radius + P[0][0] - P[1], radius + P[0][1] - P[1], P[1] * 2, P[1] * 2);
		});

		context.strokeStyle = '#ffffff';
		system.edges.every(function(edge) {
			context.beginPath();
			context.moveTo(radius + edge.A[0], radius - edge.A[1]);
			context.lineTo(radius + edge.B[0], radius - edge.B[1]);
			context.stroke();
			context.closePath();
			return true;
		});

		context.strokeStyle = '#ff0000';
		for ( var i in slotOffset) {
			var edge = system.edges[i];
			var A = [edge.A[0], edge.A[1]];
			context.beginPath();
			A = VMath.add(A, VMath.scale(edge.VN, Math.min(Math.max(slotOffset[i] - 50, 0), width - 50)));
			context.moveTo(radius + A[0], radius - A[1]);
			A = VMath.add(A, VMath.scale(edge.VN, 50));
			context.lineTo(radius + A[0], radius - A[1]);
			context.stroke();
			context.closePath();
		};

		context.fillStyle = '#ffffff';
		system.balls.every(function(ball) {
			context.beginPath();
			var P = ball.getPosition(T);
			context.arc(radius + P[0], radius + P[1], ball.R, 0, 2 * Math.PI);
			dirty.push([P, ball.R + 1]);
			context.fill();
			context.closePath();
			return true;
		})

		lastTS = new Date().getTime();
	}

	window.requestAnimationFrame(render);

	/* controls */

	var controls = dojo.create('div', {
		className : 'controls',
		style : {
			marginTop : 50 + 'px'
		}
	}, plane, 'after');

	var inputName;

	connection.on("client", function(evt) {
		if (inputName)
			return;

		inputName = dojo.create('input', {
			value : 'Guest'
		}, controls, 'first');

		dojo.create('button', {
			innerHTML : 'join',
			onclick : function() {
				this.disabled = true;
				inputName.disabled = true;
				connection.toHost("myslot", inputName.value);
				connection.on("yourslot", dojo.hitch(this, function() {
					this.parentNode.removeChild(this);
					dojo.addClass(controls, 'ingame');

					var slider = dojo.create('div', {
						className : 'slider',
						innerHTML : '<div></div>'
					}, inputName, 'after');
					var paddle = dojo.create('span', {}, slider, 'last');

					dojo.connect(new dojo.dnd.move.parentConstrainedMoveable(paddle), "onMove", function(mover) {
						boxTargetLeft = Math.min(Math.max((parseInt(mover.node.style.left) + 64) / slider.offsetWidth * width, 0), width - 15);
						connection.toHost("boxleft", boxTargetLeft)
					});
				}))
			}
		}, controls, 'last');
	});

});

(function() {
	var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
	window.requestAnimationFrame = requestAnimationFrame;
})();