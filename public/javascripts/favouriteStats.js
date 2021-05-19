$(function() {
	const canvas = document.querySelector("canvas");
	const ctx = canvas.getContext("2d");

	var Engine = Matter.Engine,
			Render = Matter.Render,
			Runner = Matter.Runner,
			Composite = Matter.Composite,
			Composites = Matter.Composites,
			MouseConstraint = Matter.MouseConstraint,
			Mouse = Matter.Mouse,
			Bodies = Matter.Bodies;

	var engine = Engine.create(), world = engine.world;
	var render = Render.create({
		canvas: canvas,
		context: ctx,
		engine: engine,
		options: {
			width: 300,
			height: 375,
			wireframes: false,
			background: "transparent"
		}
	});

	Render.run(render);

	// create runner
	var runner = Runner.create();
	Runner.run(runner, engine);

	// add bodies
	var counter = -1;  // don't know why counter++ doesn't work, so...
	var stack = Composites.stack(0, 0, 6, 7, 0, 0, function (x, y) {
		counter += 1;
		if (stats["lst"][counter] === "star") {
			return Bodies.circle(x, y, 21, {
				density: 0.6,
				frictionAir: 0.05,
				restitution: 0.2,
				friction: 0.1,
				render: {
					sprite: {
						texture: "/images/konpeito.png"
					}
				}
			});
		}
		return Bodies.circle(x, y, 21, {
			density: 0.6,
			frictionAir: 0.05,
			restitution: 0.2,
			friction: 0.1,
			render: {
				sprite: {
					texture: "/images/faces/" + (stats["lst"][counter]) + ".png",
					xScale: 0.8,
					yScale: 0.8
				}
			}
		});
	});

	Composite.add(world, [
		stack,
		Bodies.rectangle(315, 0, 50, 375 * 2, {
			isStatic: true,
			render: {
				fillStyle: "transparent"
			}
		}), // right
		Bodies.rectangle(0, 375 + 15, 600, 50, {
			isStatic: true,
			render: {
				fillStyle: "transparent"
			}
		}), // bottom
		Bodies.rectangle(-15, 375 / 2, 50, 600, {
			isStatic: true,
			render: {
				fillStyle: "transparent"
			}
		}) // left
	]);

	// add lid after jar has been filled
	setInterval(function () {
		Composite.add(world, [
			Bodies.rectangle(0, 0, 600, 100, {
				isStatic: true,
				render: {
					fillStyle: "transparent"
				}
			}) // top
		]);
	}, 1000);

	// add mouse control
	var mouse = Mouse.create(render.canvas),
			mouseConstraint = MouseConstraint.create(engine, {
				mouse: mouse,
				constraint: {
					stiffness: 0.2,
					render: {
						visible: false
					}
				}
			});

	Composite.add(world, mouseConstraint);

	// keep the mouse in sync with rendering
	render.mouse = mouse;

	Render.lookAt(render, {
		min: { x: 0, y: 0 },
		max: { x: 300, y: 375 }
	});

});
