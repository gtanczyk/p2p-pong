dojo.ready(function() {
	var plane = window.plane = dojo.create('div', {
		className : 'plane'
	}, dojo.body(), 'first');

	var n = 12;
	var width = 50

	var dx = -width / Math.sqrt(Math.pow(Math.tan(Math.PI / n), 2) + 1) * Math.cos(Math.PI / n);
	var dy = width / Math.sqrt(Math.pow(Math.tan(Math.PI / n), 2) + 1) * Math.sin(Math.PI / n);

	var last = plane;
	for ( var i = 0; i < n; i++) {
		last = dojo.create('div', {
			className : 'edge',
			style : {
				webkitTransform : 'rotate(' + (360 / n) + 'deg) translate(' + dx + 'px, ' + dy + 'px)',
				width : width + 'px'
			}
		}, last, 'last');
	}
});

function transform(n) {
	var width = 50;
	var dx = -width / Math.sqrt(Math.pow(Math.tan(Math.PI / n), 2) + 1) * Math.cos(Math.PI / n);
	var dy = width / Math.sqrt(Math.pow(Math.tan(Math.PI / n), 2) + 1) * Math.sin(Math.PI / n);
	var list = dojo.query('.edge', window.plane).style({
		webkitTransform : 'rotate(' + (360 / n) + 'deg) translate(' + dx + 'px, ' + dy + 'px)',
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