var gl;
var points = [];
var colors = [];
var center = [];
var translation = 0.0;
var direction = 1;
var thetaLoc;
var up = true;

window.onload = function init() {
    var canvas = document.getElementById("canvas");
    gl = WebGLUtils.setupWebGL(canvas);

    numvertices = 100;

    r = 0.5;    // radius of circle

    for (var i = 0; i <= numvertices; i++) {
        var angle = 2 * Math.PI * i / numvertices;
        var x = r*Math.cos(angle);
        var y = r*Math.sin(angle);
        points.push(vec2(x, y));
        colors.push(vec3(1.0, 1.0, 1.0));
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
    gl.enable(gl.DEPTH_TEST);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation(program, "a_Color");
    gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    thetaLoc = gl.getUniformLocation(program, "translation");

    render();
};

var speed = 0.01;

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(thetaLoc, translation);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, points.length);
    translation += speed * direction;

    if (translation > 1 || translation < -1) {
        direction *= -1;
    }

    requestAnimationFrame(render);
}
