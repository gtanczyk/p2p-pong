window["VMath"] = new dojo.declare("VMath", null, {
	length : function(V) {
		return Math.sqrt(V[0] * V[0] + V[1] * V[1])
	},
	distance : function(A, B) {
		return Math.sqrt(Math.pow(A[0] - B[0], 2) + Math.pow(A[1] - B[1], 2));
	},

	angle : function(A, B) {
		return Math.atan2(this.perpDot(A, B), this.dot(A, B));
	},
	dot : function(A, B) {
		return A[0] * B[0] + A[1] * B[1];
	},
	perpDot : function(A, B) {
		return A[0] * B[1] - A[1] * B[0];
	},

	sub : function(A, B) {
		return [A[0] - B[0], A[1] - B[1]];
	},
	add : function(A, B) {
		return [A[0] + B[0], A[1] + B[1]];
	},
	scale : function(V, s) {
		return [V[0] * s, V[1] * s];
	},

	rotate : function(V, a) {
		var l = this.length(V);
		a = Math.atan2(V[1], V[0]) + a;
		return [Math.cos(a) * l, Math.sin(a) * l];
	},

	reflect : function(V, N) {
		return [0, 0];
	},

	project : function(V, N) {
		return [0, 0]
	},

	// http://stackoverflow.com/a/565282
	// u = (q − p) × r / (r × s)
	// t = (q − p) × s / (r × s)
	// r x s = 0 => parallel
	// (q − p) × r = 0 => colinear
	intersect : function(Q, eQ, P, eP) {
		var S = this.sub(eQ, Q);
		var R = this.sub(eP, P);
		var RxS = this.perpDot(R, S);
		if (RxS == 0)
			return;
		var u = this.perpDot(this.sub(Q, P), R) / RxS;
		if (u == 0)
			return;
		var t = this.perpDot(this.sub(Q, P), S) / RxS;
		return [u, t]
	}

})();