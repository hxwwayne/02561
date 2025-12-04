

  var gl;
  var vertices = [];
  var points = [];

  var canvas;
  var hud;
  var clearMenu;
  var clearButton;
  var addPoints;
  var addTriangles;
  var addCircles;
  var debugButton;

  var mode = 1;

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

  var startPoint = [];
  var controlPoint = [];
  var endPoint = [];

  var baseColors = [
        vec3(0.0, 0.0, 0.0),  // black
        vec3(1.0, 0.0, 0.0),  // red
        vec3(0.0, 1.0, 0.0),  // green
        vec3(0.0, 0.0, 1.0),  // blue
      ];

  function colorConverter(colorCode){

    switch (colorCode) {
    case 0:
        return '#000000';
        break;
    case 1:
        return '#FF0000';
        break;
    case 2:
        return '#0CCF20';
        break;
    case 3:
        return '#1D7CE6';
        break;
    }

  }



function getDocumentElements(){
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');
  hud = document.getElementById('hud');

  // get HTML elements
  clearMenu = document.getElementById("clearMenu");
  clearButton = document.getElementById("clearButton");
  addPoints = document.getElementById("addPoints");
  addTriangles = document.getElementById("addTriangles");
  addCircles = document.getElementById("addCircles");

  // for printing debuggin-information in browser
  debugButton = document.getElementById("logButton");

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

  // points-button clicked
  addCurves.addEventListener("click", function(event){
    console.log("Curves button clicked");
    mode = 4;
  });

  // debug-button clicked
  debugButton.addEventListener("click", function(event){
    console.log("Points: [" + points + "] Size: " + points.length +
    "\nTriangles: [" + triangles + "] Size: " + triangles.length +
    "\nCircles: [" + circles + "] Size: " + circles.length);
  });


}

function main() {

  // Get HTML document elements and setup event listeners
  getDocumentElements();

  if (!canvas || !hud) {
    console.log('Failed to get HTML elements');
    return false;
  }

  // Get the rendering context for WebGL
  gl = getWebGLContext(canvas);

  // Get the rendering context for 2DCG
  var ctx = hud.getContext('2d');

  if (!gl || !ctx) {
    console.log('Failed to get rendering context');
    return;
  }

  gl.viewport(0,0, canvas.width, canvas.height);
  gl.enable(gl.DEPTH_TEST);

  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  // color buffer setup
  var cBuffer = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
  gl.bufferData( gl.ARRAY_BUFFER, sizeof['vec3']*
    max_verts, gl.STATIC_DRAW );

  // vertex color setup
  var vColor = gl.getAttribLocation( program, "vColor" );
  gl.vertexAttribPointer( vColor, 3, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vColor );

  // vertex buffer setup
  var vBuffer = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
  gl.bufferData( gl.ARRAY_BUFFER, max_verts, gl.STATIC_DRAW );

  // vertex position setup
  var vPosition = gl.getAttribLocation( program, "vPosition" );
  gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vPosition );

    // clear the canvas
    clearButton.addEventListener("click", function(event) {
      var bgcolor = baseColors[clearMenu.selectedIndex];
      gl.clearColor(bgcolor[0], bgcolor[1], bgcolor[2],
                    bgcolor[3],bgcolor[4],bgcolor[5]);

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
    mousepos = vec2(2*(ev.clientX - bbox.left)/canvas.width - 1, 2*
    (canvas.height - ev.clientY + bbox.top - 1)/canvas.height - 1);

    // set boundaries
    var bbox = ev.target.getBoundingClientRect();
    mousepos = vec2(2*(ev.clientX - bbox.left)/canvas.width - 1, 2*
    (canvas.height - ev.clientY + bbox.top - 1)/canvas.height - 1);

    // Switcing between drawing modes:
    switch (mode) {
    case 1:
        placeSinglePoints(cBuffer, vColor, vBuffer, vPosition);
        break;
    case 2:
        placeTriangle(cBuffer, vColor, vBuffer, vPosition);
        break;
    case 3:
        placeCircle(cBuffer, vColor, vBuffer, vPosition);
        break;
    case 4:
        placeCurve(cBuffer, vColor, vBuffer, vPosition, ctx);
        break;
    }
    });
    render();
}


function placeSinglePoints(cBuffer, vColor, vBuffer, vPosition){
  t = vec3(baseColors[colorMenu.selectedIndex]);
  gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
  gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec3'] *
    index, flatten(t));
  gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );

  points.push(index);
  t1 = mousepos;
  gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec2'] *
    index, flatten(t1));
  index++;
}

function placeTriangle(cBuffer, vColor, vBuffer, vPosition){

  // Placing first point
  if(first){

    t = vec3(baseColors[colorMenu.selectedIndex]);
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec3'] *
      index, flatten(t));
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );


    points.push(index);
    t1 = vec2(mousepos);
    gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec2'] *
      index, flatten(t1));
    index++;

    first = false;
    second = true;

    // Placing second point
  } else if (second){

    colors.push(index);
    t = vec3(baseColors[colorMenu.selectedIndex]);
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec3'] *
      index, flatten(t));
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );

    points.push(index);
    t2 = vec2(mousepos);
    gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec2'] *
      index, flatten(t2));
    index++;

    second = false;
    third = true;

    // Placing third point
  } else {
    t = vec3(baseColors[colorMenu.selectedIndex]);
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec3'] *
      index, flatten(t));

    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );

    points.pop();
    triangles.push(points.pop());
    t3 = vec2(mousepos);

    gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec2'] *
      index, flatten(t3));
    index++;

    first = true;
    third = false;
  }
}

function placeCircle(cBuffer, vColor, vBuffer, vPosition){

          // Placing first point
        if(first){

          // colors
          t = vec3(baseColors[colorMenu.selectedIndex]);
          gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
          gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec3'] *
            index, flatten(t));
          gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );


          // push first point
          points.push(index);
          t1 = vec2(mousepos);
          gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec2'] *
            index, flatten(t1));
          index++;

          first = false;
          second = true;

          // Placing second point
        } else {

          // colors
          t = vec3(baseColors[colorMenu.selectedIndex]);
          gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
          gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec3'] *
            index, flatten(t));

          // vertex
          gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
          circles.push(points.pop());
          t2 = vec2(mousepos);

          // calculate radius from point1 to point2
          var r = Math.sqrt(Math.pow((t2[0]-t1[0]),2) +
                  Math.pow((t2[1]-t1[1]),2));

          // make circle
          for (i = 0; i <= 200; i++){

            t = vec3(baseColors[colorMenu.selectedIndex]);
            gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
            gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec3'] *
              index, flatten(t));

            gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
            t2 = vec2(t1[0] + r*Math.cos(i*2*Math.PI/200),
                      t1[1] + r*Math.sin(i*2*Math.PI/200));
            gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec2'] *
              index, flatten(t2));
            index++;
          }
          second = false;
          first = true;
        }
}

// place points to calculate the bezier curve
function placeCurve(cBuffer, vColor, vBuffer, vPosition, ctx){

  // Placing first point
  if(first){

    t = vec3(baseColors[colorMenu.selectedIndex]);
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec3'] *
      index, flatten(t));
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );

    // add single start point (for visual experience)
    points.push(index);
    t1 = vec2(mousepos);
    gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec2'] *
      index, flatten(t1));
    index++;

    startPoint.push(mousepos[0].toPrecision(1));
    startPoint.push(mousepos[1].toPrecision(1));

    first = false;
    second = true;

  // Placing second point
  } else if (second){

    colors.push(index);
    t = vec3(baseColors[colorMenu.selectedIndex]);
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec3'] *
      index, flatten(t));
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );

    // add single control point (for visual experience)
    points.push(index);
    t2 = vec2(mousepos);
    gl.bufferSubData(gl.ARRAY_BUFFER, sizeof['vec2'] *
      index, flatten(t2));
    index++;

    controlPoint.push(mousepos[0].toPrecision(1));
    controlPoint.push(mousepos[1].toPrecision(1));

    second = false;
    third = true;

  // Placing third point
  } else {

    // remove start and control point
    points.pop();
    points.pop();

    endPoint.push(mousepos[0].toPrecision(1));
    endPoint.push(mousepos[1].toPrecision(1));

    placeBezierCurve(ctx, startPoint, controlPoint, endPoint);

    first = true;
    third = false;

    startPoint = [];
    controlPoint = [];
    endPoint = [];
  }
}

// draw the actual curve to the canvas
function placeBezierCurve(ctx, startPoint, controlPoint, endPoint) {
  //  ctx.clearRect(0, 0, 400, 400);

  // convert startpoint
  var startPointX = startPoint[0] * 200 + 200;
  var startPointY = -(startPoint[1] * 200 - 200);

  // convert controlpoint
  var controlPointX = controlPoint[0] * 200 + 200;
  var controlPointY = -(controlPoint[1] * 200 - 200);

  // convert endpoint
  var endPointX = endPoint[0] * 200 + 200;
  var endPointY = -(endPoint[1] * 200 - 200);

  var color = colorConverter(colorMenu.selectedIndex);

  ctx.beginPath();
  ctx.moveTo(startPointX, startPointY);
  ctx.quadraticCurveTo(controlPointX, controlPointY, endPointX, endPointY);
  ctx.strokeStyle = color;
  ctx.stroke();
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
