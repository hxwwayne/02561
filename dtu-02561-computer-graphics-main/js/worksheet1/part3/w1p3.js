var gl;
var points = [];
var colors = [];

window.onload = function init(){
  canvas = document.getElementById("gl-Canvas");
  gl = WebGLUtils.setupWebGL(canvas);

  if(!gl){
    alert("WebGL not available");
  }


// vertice points in 2d coordinates
var vertices = [
  vec2(0.0, 0.0),
  vec2(1.0, 1.0),
  vec2(1.0, 0.0)];

// create triangle
triangle(vertices[0], vertices[1], vertices[2]);

     gl.viewport( 0, 0, canvas.width, canvas.height );
     gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

     gl.enable(gl.DEPTH_TEST);

     var program = initShaders( gl, "vertex-shader", "fragment-shader" );
     gl.useProgram( program );

     var cBuffer = gl.createBuffer();
     gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
     gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

     var vColor = gl.getAttribLocation( program, "vColor" );
     gl.vertexAttribPointer( vColor, 3, gl.FLOAT, false, 0, 0 );
     gl.enableVertexAttribArray( vColor );

     var vBuffer = gl.createBuffer();
     gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
     gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

     var vPosition = gl.getAttribLocation( program, "vPosition" );
     gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
     gl.enableVertexAttribArray( vPosition );

     render();
};

function triangle(a, b, c){
  var baseColors = [
        vec3(1.0, 0.0, 0.0),
        vec3(0.0, 0.0, 1.0),
        vec3(0.0, 1.0, 0.0)];

  // vertex 1
  colors.push(baseColors[0]);
  points.push(a);
  // vertex 2
  colors.push(baseColors[1]);
  points.push(b);
  // vertex 3
  colors.push(baseColors[2]);
  points.push(c);

};

function render() {
  gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
gl.drawArrays( gl.TRIANGLES, 0, points.length );
    // LINE_LOOP, LINES, LINE_STRIP, TRIANGLES, TRIANGLE_STRIP, TRIANGLE_FAN
};
