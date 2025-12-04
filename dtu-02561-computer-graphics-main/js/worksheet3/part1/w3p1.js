var gl;
var points = [];
var colors = [];
var modelViewMatrixLoc;
var numVertices;

var colors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    vec4( 1.0, 1.0, 1.0, 1.0 ),  // white
    vec4( 0.0, 1.0, 1.0, 1.0 )   // cyan
];

var vertices = [
    vec3( -0.5, -0.5,  0.5 ),
    vec3( -0.5,  0.5,  0.5 ),
    vec3(  0.5,  0.5,  0.5 ),
    vec3(  0.5, -0.5,  0.5 ),
    vec3( -0.5, -0.5, -0.5 ),
    vec3( -0.5,  0.5, -0.5 ),
    vec3(  0.5,  0.5, -0.5 ),
    vec3(  0.5, -0.5, -0.5 )
];

var indices = [
  1,0,1,2,3,0,3,2,  // face 1
  2,6,6,5,5,1,      // face 2
  0,4,4,5,          // face 3
  6,7,7,3,          // face 4
  4,7               // face 5
];

numVertices = indices.length;

window.onload = function init(){
  canvas = document.getElementById("gl-Canvas");
  gl = WebGLUtils.setupWebGL(canvas);

  if(!gl){
    alert("WebGL not available");
}
   gl.viewport( 0, 0, canvas.width, canvas.height );
   gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

   gl.enable(gl.DEPTH_TEST);

   var program = initShaders( gl, "vertex-shader", "fragment-shader" );
   gl.useProgram( program );

   // indices buffer
   var iBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
   gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);

   var cBuffer = gl.createBuffer();
   gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
   gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

   var vColor = gl.getAttribLocation( program, "vColor" );
   gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
   gl.enableVertexAttribArray( vColor );

   var vBuffer = gl.createBuffer();
   gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
   gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

   var vPosition = gl.getAttribLocation( program, "vPosition" );
   gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
   gl.enableVertexAttribArray( vPosition );

   var eye = vec3(0.0, 0.0, 0.0);
   var at = vec3(1.0, 1.0, 1.0);
   var up = vec3(0.0, 1.0, 0.0);
   var viewMatrix = lookAt(eye, at, up);

   var modelViewMatrix = translate(0.5, 0.5, 0.0);
   modelViewMatrix = mult(modelViewMatrix, viewMatrix);

   modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
   gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

   render();
};

function render() {
  gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.drawElements( gl.LINES, numVertices, gl.UNSIGNED_BYTE, 0 );
};
