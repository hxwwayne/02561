//
// start here
//
var gl;
window.onload = function init(){
  canvas = document.getElementById("gl-Canvas");
  gl = WebGLUtils.setupWebGL(canvas);

  if(!gl){
    alert("WebGL not available");
  }

gl.viewport(0,0, canvas.width, canvas.height);
gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

program = initShaders(gl, "vertex-shader", "fragment-shader");
gl.useProgram(program);

// vertice points in 2d coordinates
var vertices = [ vec2(0.0, 0.0), vec2(1.0, 1.0), vec2(1.0, 0.0) ];

var vBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

var vPos = gl.getAttribLocation(program, "a_Position");
gl.vertexAttribPointer(vPos, 2, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(vPos);

render(vertices.length);
}

function render(len) {
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.POINTS, 0, len );
    // LINE_LOOP, LINES, LINE_STRIP, TRIANGLES, TRIANGLE_STRIP, TRIANGLE_FAN
}
