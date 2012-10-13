dojo.ready(function() {
	var n = 8;
	var width = 150;
	var radius = width / Math.sqrt(Math.pow(Math.tan(Math.PI / n), 2) + 1);

	var dx = -radius * Math.cos(Math.PI / n);
	var dy = radius * Math.sin(Math.PI / n);

	var plane = window.plane = dojo.create('div', {
		className : 'plane',
		style : {
			width : radius * 2 + 'px',
			height : radius * 2 + 'px',
			marginLeft : -radius * 2 + 'px'
		}
	}, dojo.body(), 'first');

	var last = plane;
	for ( var i = 0; i < n; i++) {
		last = dojo.create('div', {
			className : 'edge',
			style : i == 0 ? {
				width : width + 'px',
				marginTop : radius * 3 + 'px',
				marginLeft : radius + 'px'
			} : {
				webkitTransform : 'rotate(' + (360 / n) + 'deg) translate(' + dx + 'px, ' + dy + 'px)',
				MozTransform : 'rotate(' + (360 / n) + 'deg) translate(' + dx + 'px, ' + dy + 'px)',
				OTransform : 'rotate(' + (360 / n) + 'deg) translate(' + dx + 'px, ' + dy + 'px)',
				transform : 'rotate(' + (360 / n) + 'deg) translate(' + dx + 'px, ' + dy + 'px)',
				width : width + 'px'
			}
		}, last, 'last');
		last.angle = 2 * Math.PI / n * i - Math.PI / 2;
		last.normal = [Math.cos(last.angle), Math.sin(last.angle)];
		last.angle = Math.atan2(last.normal[1], last.normal[0]);

		dojo.create('b', {
			innerHTML : '0'
		}, dojo.create('div', {
			className : 'status',
			innerHTML : '<input/>',
			style : {
				webkitTransform : 'rotate(' + (-360 / n * i) + 'deg)',
				MozTransform : 'rotate(' + (-360 / n * i) + 'deg)',
				OTransform : 'rotate(' + (-360 / n * i) + 'deg)',
				transform : 'rotate(' + (-360 / n * i) + 'deg)',
				width : width + 'px'
			}
		}, last, 'last'), 'first').score = 0;
	};

	var edges = dojo.query('div.edge');

	var myBox;

	var ball = dojo.create('div', {
		innerHTML : '<span> </span>',
		className : 'ball',
		style : {
			marginTop : radius + 8 + 'px',
			marginLeft : radius + width / 2 + 'px'
		}
	}, plane, 'last');

	var ballPos = [0, 0, 0, 0];

	var lastTs = new Date().getTime();
	setInterval(function() {
		var dt = (new Date().getTime() - lastTs) / 1000 * 100;
		dojo.style(ball, {
			top : (ballPos[0] += ballPos[2] * dt) + 'px',
			left : (ballPos[1] += ballPos[3] * dt) + 'px'
		});
		lastTs = new Date().getTime();
		var pos = dojo.position(ball);
		ball.firstChild.style.display = 'none';

		for ( var i = 0; i < n; i++) {
			var el = document.elementFromPoint(pos.x - edges[i].normal[0] * 8, pos.y - edges[i].normal[1] * 8);
			if (el && (dojo.hasClass(el, 'edge') || dojo.hasClass(el, 'box'))) {
				var angle = (el.angle || el.parentNode.angle);
				var normal = (el.normal || el.parentNode.normal);
				var dp = normal[0] * ballPos[3] + normal[1] * ballPos[2];
				normal = normal.map(function(v) {
					return v * 2 * dp;
				});
				ballPos[2] = ballPos[2] - normal[1];
				ballPos[3] = ballPos[3] - normal[0];
				ballPos[0] += ballPos[2];
				ballPos[1] += ballPos[3];
				if (isHost)
					socket.send("*:ball:" + ballPos[0] + "," + ballPos[1] + "," + ballPos[2] + "," + ballPos[3]);
				dojo.addClass(el, 'hit');
				if (el.hitInterval)
					clearTimeout(el.hitInterval)
				el.hitInterval = setTimeout(function() {
					dojo.removeClass(el, 'hit');
					delete el.hitInterval;
				}, 500);

				dojo.query('>.box+.status>b', el).filter(function(status) {
					status.innerHTML = (status.score -= 1);

					if (ball.lastBox)
						dojo.query('+.status>b', ball.lastBox).filter(function(sourceStatus) {
							sourceStatus.innerHTML = (sourceStatus.score += 1);
						});
				})

				if (dojo.hasClass(el, 'box'))
					ball.lastBox = el;

				break;
			}

		}

		ball.firstChild.style.display = null;
	}, 15);

	var BOX_SPEED = 5;
	var BOX_DELAY = 100;

	function ballMove(dir) {
		if (!myBox)
			return;

		if (new Date().getTime() - lastMove < BOX_DELAY)
			return;
		var boxLeft = parseInt(myBox.style.marginLeft || '0');
		lastMove = new Date().getTime();
		myBox.style.marginLeft = boxLeft - BOX_SPEED * (dir == "left" ? -1 ? dir == "right" : 1 : 0) + 'px';
		socket.send("host:" + dir);
	}

	var lastMove = new Date().getTime();
	dojo.query(window).on("keydown", function(event) {
		if (!myBox)
			return;
		if (event.keyCode == 37 || event.keyCode == 38)
			ballMove('left');
		else if (event.keyCode == 39 || event.keyCode == 40)
			ballMove('right');
	});
	dojo.query(window).on("mousemove", function(event) {
		if (!myBox)
			return;
		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

		var coords = dojo.coords(myBox);
		
		if (event.screenX  < coords.x)
			ballMove('left');
		else if (event.screenX  > coords.x)
			ballMove('right');
	})

	var isHost;

	var slots = 0;

	var slotMap = {};

	var slotReg = {};

	var socket = new WebSocket("ws://" + document.location.hostname + ":10123");
	socket.onmessage = function(evt) {
		var header = evt.data.substring(0, evt.data.indexOf(':'));
		var body = evt.data.substring(evt.data.indexOf(':') + 1);
		console.log(header, body);
		if (header == 'host') {
			isHost = true;
			// setInterval(function() {
			var dir = Math.random();
			socket.send("*:ball:" + ballPos[0] + "," + ballPos[1] + "," + (ballPos[3] = Math.cos(dir)) + "," + (ballPos[2] = Math.sin(dir)));
			// }, 1000)
		} else if (isHost && body == 'left' && slotMap[header] != null) {
			var box = dojo.query('>.box', edges[slotMap[header]])[0];
			if (box) {
				var boxLeft = parseInt(box.style.marginLeft || '0');
				socket.send("*:left:" + slotMap[header] + "?" + boxLeft)
			}
		} else if (isHost && body == 'right' && slotMap[header] != null) {
			var box = dojo.query('>.box', edges[slotMap[header]])[0];
			if (box) {
				var boxLeft = parseInt(box.style.marginLeft || '0');
				socket.send("*:right:" + slotMap[header] + "?" + boxLeft)
			}
		} else if (isHost && body.match(/^myslot/)) {
			slotMap[header] = slots++;
			socket.send(header + ":yourslot:" + slotMap[header]);
			socket.send("*:regslot:" + slotMap[header]);
			socket.send("*:slots:" + slots);
			socket.send("*:nameslot:" + slotMap[header] + ":" + body.split(':')[1]);
			for ( var i in slotReg)
				socket.send(header + ":regslot:" + i);
			// transform(n = Math.max(slots + 1, 3), width);
			// socket.send("*:transform:" + n + "," + width);
		} else if (isHost && body == 'leaveslot') {
			socket.send("*:leaveslot:" + slotMap[header]);
		} else if (header == 'yourslot') {
			myBox = dojo.create('div', {
				className : 'box'
			}, edges[parseInt(body)], 'first');
			slotReg[parseInt(body)] = true;
		} else if (header == 'regslot') {
			if (!slotReg[parseInt(body)]) {
				dojo.create('div', {
					className : 'box'
				}, edges[parseInt(body)], 'first');
				slotReg[parseInt(body)] = true;
			}
		} else if (header == 'nameslot') {
			body = body.split(':');
			dojo.query('>.status>input', edges[parseInt(body[0])]).filter(function(input) {
				input.value = body[1];
			})
		} else if (!isHost && header == 'slots') {
			slots = parseInt(body);
		} else if (header == 'leaveslot') {
			delete slotReg[parseInt(body)];
			var box = dojo.query('>.box', edges[body[0]])[0];
			box.parentNode.removeChild(box);
		} else if (isHost && body == 'leave') {
			if (slotMap[header]) {
				if (!slotReg[slotMap[header] + 1])
					socket.send("*:slots:" + (slots--));
				socket.send("*:leaveslot:" + slotMap[header]);
				delete slotMap[header];
			}
		} else if (header == 'left') {
			body = body.split('?');
			var box = dojo.query('>.box', edges[body[0]])[0];
			if (box) {
				var boxLeft = parseInt(body[1]);
				dojo.style(box, {
					marginLeft : (boxLeft = Math.max((boxLeft - BOX_SPEED), 0)) + 'px'
				});
			}
		} else if (header == 'right') {
			body = body.split('?');
			var box = dojo.query('>.box', edges[body[0]])[0];
			if (box) {
				var boxLeft = parseInt(body[1]);
				dojo.style(box, {
					marginLeft : (boxLeft = Math.min((boxLeft + BOX_SPEED), width - 25)) + 'px'
				})
			}
		} else if (header == 'ball') {
			ballPos = body.split(',').map(function(v) {
				return parseFloat(v);
			});
		} else if (header == 'transform') {
			body = body.split(',');
			transform(n = parseInt(body[0]), width = parseInt(body[1]));
		}
	};
	socket.onerror = function(evt) {
		console.log(evt);
	};

	/* controls */

	var controls = dojo.create('div', {
		className : 'controls',
		style : {
			marginTop : dojo.coords(edges[0]).y + 50 + 'px'
		}
	}, plane, 'last');

	socket.onopen = function(evt) {
		var inputName = dojo.create('input', {
			value : 'Guest'
		}, controls, 'first');

		dojo.create('button', {
			innerHTML : 'join',
			onclick : function() {
				socket.send("host:myslot:" + inputName.value);
				inputName.disabled = true;
				this.parentNode.removeChild(this);
				dojo.addClass(controls, 'ingame');
			}
		}, controls, 'last');
	};
});

function transform(n, width) {
	return;
	var dx = -width / Math.sqrt(Math.pow(Math.tan(Math.PI / n), 2) + 1) * Math.cos(Math.PI / n);
	var dy = width / Math.sqrt(Math.pow(Math.tan(Math.PI / n), 2) + 1) * Math.sin(Math.PI / n);
	var list = dojo.query('.edge', window.plane).style({
		webkitTransform : 'rotate(' + (360 / n) + 'deg) translate(' + dx + 'px, ' + dy + 'px)',
		mozTransform : 'rotate(' + (360 / n) + 'deg) translate(' + dx + 'px, ' + dy + 'px)',
		width : width + 'px'
	});
	if (list.length < n)
		for ( var i = list.length; i < n; i++) {
			list.push(dojo.create('div', {
				className : 'edge',
				style : {
					webkitTransform : 'rotate(' + (360 / n) + 'deg) translate(' + dx + 'px, ' + dy + 'px)',
					MozTransform : 'rotate(' + (360 / n) + 'deg) translate(' + dx + 'px, ' + dy + 'px)',
					width : width + 'px'
				}
			}, list[list.length - 1], 'last'));
		}

	list.filter(function(el, i) {
		dojo.style(el, (i >= n) ? {
			display : 'none',
			visibility : 'hidden'
		} : {
			display : 'block',
			visibility : 'visible'
		});
		el.angle = Math.PI / n * 2 * i;
		el.normal = [Math.cos(el.angle), Math.sin(el.angle)];
		el.angle = Math.atan2(el.normal[1], el.normal[0]);
	});
}