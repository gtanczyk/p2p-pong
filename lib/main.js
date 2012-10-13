dojo.ready(function() {
	var plane = window.plane = dojo.create('div', {
		className : 'plane'
	}, dojo.body(), 'first');

	var n = 12;
	var width = 100;

	var dx = -width / Math.sqrt(Math.pow(Math.tan(Math.PI / n), 2) + 1) * Math.cos(Math.PI / n);
	var dy = width / Math.sqrt(Math.pow(Math.tan(Math.PI / n), 2) + 1) * Math.sin(Math.PI / n);

	var last = plane;
	for ( var i = 0; i < n; i++) {
		last = dojo.create('div', {
			className : 'edge',
			style : {
				webkitTransform : 'rotate(' + (360 / n) + 'deg) translate(' + dx + 'px, ' + dy + 'px)',
				MozTransform : 'rotate(' + (360 / n) + 'deg) translate(' + dx + 'px, ' + dy + 'px)',
				width : width + 'px'
			}
		}, last, 'last');
	}

	var edges = dojo.query('div.edge');

	var myBox;

	dojo.query(window).on("keydown", function(event) {
		// console.log(event.keyCode);
		// socket.send(event.keyCode);
		var boxLeft = parseInt(myBox.style.marginLeft || '0');
		if (event.keyCode == 37 || event.keyCode == 38)
			socket.send("host:left");
		else if (event.keyCode == 39 || event.keyCode == 40)
			socket.send("host:right");
	});

	var isHost;

	var slots = 0;

	var slotMap = {};

	var slotReg = {};

	var socket = new WebSocket("ws://localhost:10123");
	socket.onopen = function(evt) {
		socket.send("host:myslot");
	};
	socket.onmessage = function(evt) {
		var header = evt.data.substring(0, evt.data.indexOf(':'));
		var body = evt.data.substring(evt.data.indexOf(':') + 1);
		console.log(header, body);
		if (header == 'host')
			isHost = true;
		else if (isHost && body == 'left') {
			socket.send("*:left:" + slotMap[header] + "?" + body)
		} else if (isHost && body == 'right') {
			socket.send("*:right:" + slotMap[header] + "?" + body)
		} else if (isHost && body == 'myslot') {
			slotMap[header] = slots++;
			socket.send(header + ":yourslot:" + slotMap[header]);
			socket.send("*:regslot:" + slotMap[header]);
			socket.send("*:slots:" + slots);
			for ( var i in slotReg)
				socket.send(header + ":regslot:" + i);
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
				var boxLeft = parseInt(box.style.marginLeft || '0');
				dojo.style(box, {
					marginLeft : (boxLeft = Math.max((boxLeft - 10), 0)) + 'px'
				});
			}
		} else if (header == 'right') {
			body = body.split('?');
			var box = dojo.query('>.box', edges[body[0]])[0];
			if (box) {
				var boxLeft = parseInt(box.style.marginLeft || '0');
				dojo.style(box, {
					marginLeft : (boxLeft = Math.min((boxLeft + 10), width - 25)) + 'px'
				})
			}
		}
	};
	socket.onerror = function(evt) {
		console.log(evt);
	};
});

function transform(n) {
	var width = 50;
	var dx = -width / Math.sqrt(Math.pow(Math.tan(Math.PI / n), 2) + 1) * Math.cos(Math.PI / n);
	var dy = width / Math.sqrt(Math.pow(Math.tan(Math.PI / n), 2) + 1) * Math.sin(Math.PI / n);
	var list = dojo.query('.edge', window.plane).style({
		webkitTransform : 'rotate(' + (360 / n) + 'deg) translate(' + dx + 'px, ' + dy + 'px)',
		mozTransform : 'rotate(' + (360 / n) + 'deg) translate(' + dx + 'px, ' + dy + 'px)',
		width : width + 'px'
	});
	list.filter(function(el, i) {
		dojo.style(el, (i >= n) ? {
			display : 'none',
			visibility : 'hidden'
		} : {
			display : 'block',
			visibility : 'visible'
		})
	})
}