var gl;
var points = [];
var colors = [];
var theta = 0.0;
var thetaLoc;
var anim = true;

window.onload = function init(){
  canvas = document.getElementById("gl-Canvas");
  gl = WebGLUtils.setupWebGL(canvas);

  if(!gl){
    alert("WebGL not available");
  }


 var stopButton = document.getElementById("stopButton");
 stopButton.addEventListener("click", function(event) {
   if(anim == true) anim = false;

   console.log("stop button pressed");


 });

var vertices = [
  vec2(-0.5, 0.5),
  vec2(0.5, 0.5),
  vec2(0.5, -0.5),
  vec2(-0.5, -0.5),
];

square(vertices[0], vertices[1], vertices[2], vertices[3]);

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

     thetaLoc = gl.getUniformLocation( program, "theta" );

     render();
};

function square(a, b, c, d){
  var baseColors = [
        vec3(1.0, 0.0, 0.0),
        vec3(0.0, 0.0, 1.0),
        vec3(0.0, 1.0, 0.0),
        vec3(1.0, 1.0, 1.0), // white
      ];

  // vertex 1
  colors.push(baseColors[3]);
  points.push(a);
  // vertex 2
  colors.push(baseColors[3]);
  points.push(b);
  // vertex 3
  colors.push(baseColors[3]);
  points.push(c);

  // vertex 3
  colors.push(baseColors[3]);
  points.push(d);

};

function render() {
  gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
gl.drawArrays( gl.TRIANGLE_FAN, 0, points.length );

theta += 0.01;
gl.uniform1f( thetaLoc, theta );
if(anim == true) window.requestAnimFrame(render);
    // LINE_LOOP, LINES, LINE_STRIP, TRIANGLES, TRIANGLE_STRIP, TRIANGLE_FAN
};
