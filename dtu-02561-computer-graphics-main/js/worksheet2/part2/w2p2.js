var gl;
var points = [];
var colors = [];

var baseColors = [
      vec3(0.3921, 0.5843, 0.9294), // skyblue
      vec3(1.0, 1.0, 1.0),          // white
      vec3(0.211, 0.211, 0.211),    // grey
      vec3(0.47, 0.79, 0.79),       // Cyan green
      vec3(0.255, 0.255, 20.0),     // Blue screen of death
      vec3(0.0, 0.0, 0.0),          // Black
    ];

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

  // get HTML elements
  var clearMenu = document.getElementById("clearMenu");
  var clearButton = document.getElementById("clearButton");

  // clear the canvas
  clearButton.addEventListener("click", function(event) {
    var bgcolor = baseColors[clearMenu.selectedIndex];
    gl.clearColor(bgcolor[0], bgcolor[1], bgcolor[2], bgcolor[3],bgcolor[4],bgcolor[5]);

    // clear canvas of points (and clear color array)
    points = [];
    colors = [];
    render();
  });

  var mousepos = vec2(0.0, 0.0);
  canvas.addEventListener("click", function (ev) {
    // set boundaries
    var bbox = ev.target.getBoundingClientRect();
    mousepos = vec2(2*(ev.clientX - bbox.left)/canvas.width - 1, 2*(canvas.height - ev.clientY + bbox.top - 1)/canvas.height - 1);



  //  var bgcolor = baseColors[clearMenu.selectedIndex];
//    colors = [];
    // add points and color to their arrays
    console.log(mousepos);
    colors.push(baseColors[colorMenu.selectedIndex]); // black
    points.push(mousepos);

    // color buffer setup
    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    // vertex color setup
    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    // vertex buffer setup
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    // vertex position setup
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    // render each time a new mouseclick-event happens
    render();
  });

// initial render for a blank canvas
render();
}

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT);
    gl.drawArrays( gl.POINTS, 0, points.length );
    // LINE_LOOP, LINES, LINE_STRIP, TRIANGLES, TRIANGLE_STRIP, TRIANGLE_FAN
}
