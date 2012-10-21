window["model.System"] = dojo.declare("model.System", null, {

	constructor : function(args) {
		dojo.safeMixin(this, args);
		this.T = this.T || 0; // ms

		this.events = []; // {T: time, event}

		this.balls = [];
		this.edges = [];
	},

	doStep : function(dT) {
		var balls = this.balls, edges = this.edges;

		dT = Math.min(dT, 1);

		var T = this.T;

		var iT = this.T + dT;
		var jT = dT;
		var _T;
		var collisions = [];

		balls.every(function(ballA, k) {
			balls.every(function(ballB, l) {
				if (k > l && (_T = ballA.intersectWithBall(ballB)) <= iT - T) {
					if (_T < 0)
						return l < k;
					if (_T < jT) {
						collisions = [];
						jT = _T;
					}
					collisions.push([ballA, ballB]);
					iT = T + _T;
				}
				return l < k;
			});

			edges.every(function(edge) {
				if ((_T = ballA.intersectWithEdge(edge)) <= iT - T) {
					if (_T < 0)
						return l < k;
					if (_T < jT) {
						collisions = [];
						jT = _T;
					}
					collisions.push([ballA, edge]);
					iT = T + _T;
				}
				return true;
			});

			return true;
		});

		dT = iT - this.T;

		collisions.every(function(collision) {
			collision[0].reflectFrom(collision[1], iT);
			return true;
		});

		balls.every(function(ball) {
			ball.doStep(iT, dT);
			return true;
		})

		return (this.T = iT) - T;
	},

	addBall : function(ball) {
		if (ball.ID)
			this.balls[ball.ID] = ball;
		else
			this.balls.push(ball);
		return ball;
	},

	addEdge : function(edge) {
		if (edge.ID)
			this.edges[edge.ID] = edge;
		else
			this.edges.push(edge);
		return edge;
	}

});

window["model.Edge"] = dojo.declare("model.Edge", null, {

	constructor : function(system, args) {
		dojo.safeMixin(this, args);

		this.N = VMath.normal(this.A, this.B)[0];
		this.VN = VMath.normalize(VMath.sub(this.B, this.A));

		system.addEdge(this);
	}

});

window["model.Ball"] = dojo.declare("model.Ball", null, {

	// all position and velocity changes in T
	constructor : function(system, args) {
		dojo.safeMixin(this, args);
		this.system = system;

		system.addBall(this);

		this._position = new model.OrderedHash();
		this._velocity = new model.OrderedHash();

		this._position.put(system.T, this.P);
		this._velocity.put(system.T, this.V);
	},

	doStep : function(T, dT) {
		this.P = this.getPosition(T + VMath.EPSILON);
		this.V = this.getVelocity(T);
	},

	intersectWithBall : function(ball) {
		if (VMath.distance(ball.P, this.P) < this.R + ball.R)
			return;// throw 'error';

		return (VMath.intersectSphereSphere(this.P, ball.P, this.V, ball.V, this.R, ball.R) || [])[0];
	},

	intersectWithEdge : function(edge) {
		var T = (VMath.intersectSphereLine(this.P, this.V, this.R, edge.A, edge.B) || [])[0];
		if (T >= 0)
			return T;
	},

	reflectFrom : function(object, T) {
		if (object.declaredClass == 'model.Edge') {
			// R = V - 2* N x V * N
			this.updateVelocity(T, VMath.sub(this.getVelocity(T), VMath.scale(object.N, 2 * VMath.dot(object.N, this.getVelocity(T)))));
		} else if (object.declaredClass == 'model.Ball') {
			// http://www.gamasutra.com/view/feature/131424/pool_hall_lessons_fast_accurate_.php?print=1
			// First, find the normalized vector n from the center of
			// circle1 to the center of circle2
			var N = VMath.normalize(VMath.sub(object.getPosition(T), this.getPosition(T)));
			// Find the length of the component of each of the movement
			// vectors along n.
			// a1 = v1 . n
			// a2 = v2 . n
			var a1 = VMath.dot(this.V, N);
			var a2 = VMath.dot(object.V, N);

			// Using the optimized version,
			// optimizedP = 2(a1 - a2)
			// -----------
			// m1 + m2
			var optimizedP = (2.0 * (a1 - a2)) / (this.R + object.R);

			// Calculate v1', the new movement vector of circle1
			// v1' = v1 - optimizedP * m2 * n
			var Vr1 = VMath.sub(this.V, VMath.scale(N, optimizedP * object.R));

			// Calculate v1', the new movement vector of circle1
			// v2' = v2 + optimizedP * m1 * n
			var Vr2 = VMath.add(object.V, VMath.scale(N, optimizedP * this.R));

			this.updateVelocity(T, Vr1);
			object.updateVelocity(T, Vr2);
		}
	},

	updateVelocity : function(T, V, prevent) {
		var P = this.getPosition(T);
		this.updatePosition(T, P);
		this._velocity.put(T, V);
		if (!prevent && this.onUpdate)
			this.onUpdate(T, P, V);
	},

	updatePosition : function(T, P, prevent) {
		if (this.system.bounds)
			P = [Math.min(Math.max(P[0], this.system.bounds[0] + this.R), this.system.bounds[2] - this.R),// 
			Math.min(Math.max(P[1], this.system.bounds[1] + this.R), this.system.bounds[3] - this.R)]
		this._position.put(T, P);
	},

	getVelocity : function(T) {
		var velocity = this._velocity.get(T);
		// / We do not interpolate velocity (yet)
		// if (!velocity.upper)
		return velocity.lower[1];
		// else {
		// return velocity.lower[1] + (velocity.upper[1] - velocity.lower[1]) *
		// ((T - velocity.lower[0]) / (velocity.upper[0] - velocity.lower[0]))
		// }
	},

	getPosition : function(T) {
		var position = this._position.get(T);
		var velocity = this.getVelocity(T);
		var P = VMath.add(position.lower[1], VMath.scale(velocity, (T - position.lower[0])));
		if (this.system.bounds)
			P = [Math.min(Math.max(P[0], this.system.bounds[0] + this.R), this.system.bounds[2] - this.R),// 
			Math.min(Math.max(P[1], this.system.bounds[1] + this.R), this.system.bounds[3] - this.R)]
		return P;
	}

});

window["model.OrderedHash"] = dojo.declare("model.OrderedHash", null, {

	constructor : function() {
		this.keys = [];
		this.values = {};
	},

	put : function(key, value) {
		if (this.keys.length == 0)
			this.keys[0] = key;
		else
			for ( var i = 0; i < this.keys.length; i++)
				if (this.keys[i] < key && (typeof this.keys[i + 1] == "undefined" || this.keys[i + 1] > key)) {
					i++;
					for (; i < this.keys.length; i++)
						delete this.values[this.keys[i]];
					this.keys.length = i;
					this.keys.push(key);
					break;
				}

		this.values[key] = value;
	},

	get : function(key) {
		if (typeof this.values[key] != "undefined")
			return {
				lower : [key, this.values[key]]
			};
		else
			for ( var i = 0; i < this.keys.length; i++)
				if (this.keys[i] >= key && typeof this.keys[i + 1] == "undefined" || this.keys[i + 1] > key)
					return {
						upper : [this.keys[i + 1], this.values[this.keys[i + 1]]],
						lower : [this.keys[i], this.values[this.keys[i]]]
					};
		return {
			lower : [this.keys[this.keys.length - 1], this.values[this.keys[this.keys.length - 1]]]
		}
	}

});