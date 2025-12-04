var gl;
var points = [];
var colors = [];
var center = [];
var theta = 0.0;
var thetaLoc;
var speed;

var up = true;

window.onload = function init(){
  canvas = document.getElementById("gl-Canvas");
  gl = WebGLUtils.setupWebGL(canvas);

  if(!gl){
    alert("WebGL not available");
  }

   //create circle(radius, number of vertices)
   circle(0.5, 200);

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

function circle(r, vertices){
  var baseColors = [
        vec3(1.0, 0.0, 0.0),
        vec3(0.0, 0.0, 1.0),
        vec3(0.0, 1.0, 0.0),
        vec3(1.0, 1.0, 1.0), // white
      ];

      for (i = 0; i <= vertices; i++){
        colors.push(baseColors[3]);
        points.push(
          r*Math.cos(i*2*Math.PI/vertices),
          r*Math.sin(i*2*Math.PI/vertices));
      }
};

function render() {
  gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform1f( thetaLoc, theta );
  gl.drawArrays( gl.TRIANGLE_FAN, 0, points.length);
  // LINE_LOOP, LINES, LINE_STRIP, TRIANGLES, TRIANGLE_STRIP, TRIANGLE_FAN

  // bounce circle within boundaries on y-axis
  speed = 0.01;
  if (theta <= 0.5 && up){
    theta += speed;
    if(theta > 0.49){
      up = false;
    }
  } else {
    theta -= speed;
    if(theta < -0.49){
      up = true;
    }
  }


  window.requestAnimFrame(render);
};
