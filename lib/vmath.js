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
	intersectLineLine : function(Q, eQ, P, eP) {
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
	},

	// http://www.gamasutra.com/view/feature/131790/simple_intersection_tests_for_games.php?page=2
	// (B[u] - A[u]) x (B[u]-A[u]) = (Ra+Rb)^2
	// AB x AB + (2 * Vab x AB) * u + Vab x Vab * u^2 = (ra + rb)^2
	intersectSphereSphere : function(A, B, Va, Vb, Ra, Rb) {
		var AB = this.sub(B, A);
		var Vab = this.sub(Vb, Va);
		var Rab = Ra + Rb;
		var dotAB = this.dot(AB, AB);
		var sqrRab = Rab * Rab;

		var a = this.dot(Vab, Vab);

		var b = 2 * this.dot(Vab, AB);

		var c = dotAB - sqrRab;

		if (dotAB <= sqrRab)
			return [0, 0];

		var d = b * b - 4 * a * c;

		if (d < 0)
			return;

		d = Math.sqrt(d);

		var T1 = (-b - d) / (2 * a)
		var T2 = (-b + d) / (2 * a);

		return T1 < T2 ? [T1, T2] : [T2, T1];
	},

	// P - circle center,
	// R - radius,
	// V - velocity
	// A, B - segment points
	intersectSphereLine : function(P, V, R, A, B) {
		var AB = this.sub(B, A);
		var ivdotAB = 1 / Math.sqrt(this.dot(AB, AB));
		var N1 = this.scale([-AB[1], AB[0]], ivdotAB);
		var N2 = this.scale([AB[1], -AB[0]], ivdotAB);
		N1 = this.add(P, N1);
		N2 = this.add(P, N2);

		var T = [this.intersectLineLine(N1, this.add(N1, V), A, B), this.intersectLineLine(N2, this.add(N2, V), A, B)];

		if (T[0][0] < T[1][0])
			T = T[0];
		else
			T = T[1];

		if (T[0][0] < 0 || T[1] < 0)
			return;

		if (T[0] < 1 && T[1] < 1)
			return T;
	}

})();