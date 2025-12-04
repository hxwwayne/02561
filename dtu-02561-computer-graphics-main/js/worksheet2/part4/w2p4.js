var gl;

var mode = 1;

// implement the z to mouseclick: 1-(index+1)*2*max_verts

//var mode = true;
var first = true;
var second = false;
var third = false;

var max_triangles = 100000;
var max_verts = 3 * max_triangles;
var index = 0;

var t1 = [];
var t2 = [];
var t3 = [];
var t4 = [];
var t = [];

var points = [];
var triangles = [];
var circles = [];
var colors = [];

var baseColors = [
      vec3(0.0, 0.0, 0.0),  // black
      vec3(1.0, 0.0, 0.0),  // red
      vec3(0.0, 1.0, 0.0),  // green
      vec3(0.0, 0.0, 1.0),  // blue
    ];

window.onload = function init(){
  canvas = document.getElementById("gl-Canvas");
  gl = WebGLUtils.setupWebGL(canvas);

  if(!gl){
    alert("WebGL not available");
  }

  gl.viewport(0,0, canvas.width, canvas.height);
  gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);
  gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  // get HTML elements
  var clearMenu = document.getElementById("clearMenu");
  var clearButton = document.getElementById("clearButton");
  var addPoints = document.getElementById("addPoints");
  var addTriangles = document.getElementById("addTriangles");
  var addCircles = document.getElementById("addCircles");

  // for printing debuggin-information in browser
  var debugButton = document.getElementById("logButton");

  // color buffer setup
  var cBuffer = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
  gl.bufferData( gl.ARRAY_BUFFER, sizeof['vec3']*max_verts, gl.STATIC_DRAW );

  // vertex color setup
  var vColor = gl.getAttribLocation( program, "vColor" );
  gl.vertexAttribPointer( vColor, 3, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vColor );

  // vertex buffer setup
  var vBuffer = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
  gl.bufferData( gl.ARRAY_BUFFER, max_verts, gl.STATIC_DRAW );

  // debug-button clicked
  debugButton.addEventListener("click", function(event){
    console.log("Points: [" + points + "] Size: " + points.length + "\nTriangles: [" + triangles + "] Size: " + triangles.length + "\nCircles: [" + circles + "] Size: " + circles.length);
  });

  // triangle-button clicked
  addTriangles.addEventListener("click", function(event){
    console.log("Triangle button clicked");
    mode = 2;
    //mode = false;
  });

  // points-button clicked
  addPoints.addEventListener("click", function(event){
    console.log("Points button clicked");
    mode = 1;
  });

  // points-button clicked
  addCircles.addEventListener("click", function(event){
    console.log("Circles button clicked");
    mode = 3;
  });

  // vertex position setup
  var vPosition = gl.getAttribLocation( program, "vPosition" );
  gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vPosition );

  // clear the canvas
  clearButton.addEventListener("click", function(event) {
    var bgcolor = baseColors[clearMenu.selectedIndex];
    gl.clearColor(bgcolor[0], bgcolor[1], bgcolor[2], bgcolor[3],bgcolor[4],bgcolor[5]);

    // reset everything
    first = true;
    second = false;
    third = false;

    mode = 1;
    index = 0;

    t1 = [];
    t2 = [];
    t3 = [];
    t4 = [];
    t = [];

    points = [];
    triangles = [];
    circles = [];
    colors = [];
    render();
  });

  // get mouseclick and draw points/triangles/circles
  canvas.addEventListener("click", function (ev) {
    // set boundaries
    var bbox = ev.target.getBoundingClientRect();
    mousepos = vec2(2*(ev.clientX - bbox.left)/canvas.width - 1, 2*(canvas.height - ev.clientY + bbox.top - 1)/canvas.height - 1);

    // mode: true = points, false = triangles
    if(mode == 1){
      console.log("[point mode] point added at mousepos: [" + mousepos[0].toPrecision(1)+ ","+ mousepos[1].toPrecision(1) + "]");

      t = vec3(baseColors[colorMenu.selectedIndex]);
      gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
      gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec3']*index, flatten(t));
      gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );

      points.push(index);
      t1 = mousepos;
      gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec2']*index, flatten(t1));
      index++;

    } else if (mode == 2){

      if(first){
        console.log("[triangle mode] first point added at mousepos: [" + mousepos[0].toPrecision(1)+ ","+ mousepos[1].toPrecision(1) + "]");

        t = vec3(baseColors[colorMenu.selectedIndex]);
        gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
        gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec3']*index, flatten(t));
        gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );


        points.push(index);
        t1 = vec2(mousepos);
        gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec2']*index, flatten(t1));
        index++;

        first = false;
        second = true;

      } else if (second){
        console.log("[triangle mode] second point added at mousepos: [" + mousepos[0].toPrecision(1)+ ","+ mousepos[1].toPrecision(1) + "]");

        colors.push(index);
        t = vec3(baseColors[colorMenu.selectedIndex]);
        gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
        gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec3']*index, flatten(t));
        gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );

        points.push(index);
        t2 = vec2(mousepos);
        gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec2']*index, flatten(t2));
        index++;

        second = false;
        third = true;

      } else {
        t = vec3(baseColors[colorMenu.selectedIndex]);
        gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
        gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec3']*index, flatten(t));

        gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );

        points.pop();
        triangles.push(points.pop());
        t3 = vec2(mousepos);

        gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec2']*index, flatten(t3));
        index++;

        first = true;
        third = false;
      }
    } else if (mode == 3){ // circle mode

      // first mouseclick
      if(first){
        console.log("[circle mode] first point added at mousepos: [" + mousepos[0].toPrecision(1)+ ","+ mousepos[1].toPrecision(1) + "]");

        // colors
        t = vec3(baseColors[colorMenu.selectedIndex]);
        gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
        gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec3']*index, flatten(t));
        gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );


        // push first point
        points.push(index);
        t1 = vec2(mousepos);
        gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec2']*index, flatten(t1));
        index++;

        first = false;
        second = true;

        // second mouseclick
      } else {
        console.log("[circle mode] second point added at mousepos: [" + mousepos[0].toPrecision(1)+ ","+ mousepos[1].toPrecision(1) + "]");

        // colors
        t = vec3(baseColors[colorMenu.selectedIndex]);
        gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
        gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec3']*index, flatten(t));

        // vertex
        gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
        circles.push(points.pop());
        t2 = vec2(mousepos);

        // calculate radius from point1 to point2
        var r = Math.sqrt(Math.pow((t2[0]-t1[0]),2) + Math.pow((t2[1]-t1[1]),2));


        // make circle
        for (i = 0; i <= 200; i++){

          t = vec3(baseColors[colorMenu.selectedIndex]);
          gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
          gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec3']*index, flatten(t));

          gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
          t2 = vec2(t1[0] + r*Math.cos(i*2*Math.PI/200), t1[1] + r*Math.sin(i*2*Math.PI/200));
          gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec2']*index, flatten(t2));
          index++;
        }
        second = false;
        first = true;
      }
    }
  });
  render();
}

function render() {
  gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // iterate thru all indexes of points-array and draw each point
  for(var i = 0; i < points.length; i++){
    gl.drawArrays(gl.POINTS, points[i],  1);
  }

  // iterate thru all indexes of triangle-array and draw each triangle
  for (var i = 0; i < triangles.length; i++){
    gl.drawArrays(gl.TRIANGLE_FAN, triangles[i], 3);
  }

  // iterate thru all indexes of triangle-array and draw each triangle
  for (var i = 0; i < circles.length; i++){
    gl.drawArrays(gl.TRIANGLE_FAN, circles[i], 202);
  }
  window.requestAnimFrame(render);
}
