

var canvas;
var gl;

var near = 0.1;
var far = 5;
var fovy = 45.0;

var radius = 2;
var theta  = 0.0;
var scale = 0.2;

var mvMatrix, pMatrix;
var modelViewMatrixLoc, projection, normalMatrixLoc;


var orbit = true;

var g_objDoc = null;      // The information of OBJ file
var g_drawingInfo = null; // The information for drawing 3D model
var model;

var lightPosition = vec4(0.0, 0.0, 1.0, 0.0 );
var Le = 2.5;
var Li = vec4(0.75, 0.75, 0.75, 0.75);
var kd = vec4(0.5, 0.5, 0.5, 0.5);
var ka = vec4(0.1, 0.1, 0.1, 0.1);
var ks = vec4(0.25, 0.25, 0.25, 0.25);
var alpha = 75.0;



function initObject(gl, obj_filename, scale){
    gl.program.a_Position = gl.getAttribLocation(gl.program, 'vPosition');
    gl.program.a_Normal = gl.getAttribLocation(gl.program, 'vNormal');
    gl.program.a_Color = gl.getAttribLocation(gl.program, 'fColor');

    gl.uniform4fv( gl.getUniformLocation(gl.program,"Li"),flatten(Li) );
    gl.uniform4fv( gl.getUniformLocation(gl.program,"kd"),flatten(kd) );
    gl.uniform4fv( gl.getUniformLocation(gl.program,"ka"),flatten(ka) );
    gl.uniform4fv( gl.getUniformLocation(gl.program,"ks"),flatten(ks) );
    gl.uniform1f( gl.getUniformLocation(gl.program,"alpha"), alpha );
    gl.uniform1f( gl.getUniformLocation(gl.program,"Le"), Le );
    gl.uniform4fv( gl.getUniformLocation(gl.program,"lightPosition"),flatten(lightPosition) );

    // Prepare empty buffer objects for vertex coordinates, colors, and normals
    var model = initVertexBuffers(gl);

    // Start reading the OBJ file
    readOBJFile(obj_filename, gl, model, scale, true);

    return model;
}

// Create a buffer object and perform the initial configuration
    function initVertexBuffers(gl) {
      var o = new Object();
      o.vertexBuffer = createEmptyArrayBuffer(gl, gl.program.a_Position, 3, gl.FLOAT);
      o.normalBuffer = createEmptyArrayBuffer(gl, gl.program.a_Normal, 3, gl.FLOAT);
      o.colorBuffer = createEmptyArrayBuffer(gl, gl.program.a_Color, 4, gl.FLOAT);
      o.indexBuffer = gl.createBuffer();

      return o;
    }

  // Create a buffer object, assign it to attribute variables, and enable the assignment
   function createEmptyArrayBuffer(gl, a_attribute, num, type) {
       var buffer =  gl.createBuffer();  // Create a buffer object

       gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
       gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
       gl.enableVertexAttribArray(a_attribute);  // Enable the assignment

       return buffer;
     }

  // Read a file
  function readOBJFile(fileName, gl, model, scale, reverse) {
      var request = new XMLHttpRequest();

      request.onreadystatechange = function() {
        if (request.readyState === 4 && request.status !== 404) {
          onReadOBJFile(request.responseText, fileName, gl, model, scale, reverse);
        }
      }
      request.open("GET", fileName, true); // Create a request to get file
      request.send();                      // Send the request
    }



  // OBJ File has been read
   function onReadOBJFile(fileString, fileName, gl, o, scale, reverse) {
       var objDoc = new OBJDoc(fileName);  // Create a OBJDoc object
       var result  = objDoc.parse(fileString, scale, reverse);
       if (!result) {
         g_objDoc = null; g_drawingInfo = null;
         console.log("OBJ file parsing error.");
         return;
       }
       g_objDoc = objDoc;
     }

  // OBJ File has been read compreatly
   function onReadComplete(gl, model, objDoc) {
       // Acquire the vertex coordinates and colors from OBJ file
       var drawingInfo = objDoc.getDrawingInfo();

       // Write date into the buffer object
       gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
       gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices,gl.STATIC_DRAW);

       gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
       gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);

       gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
       gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);

       // Write the indices to the buffer object
       gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
       gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);

       return drawingInfo;
     }


window.onload = function init() {

    canvas = document.getElementById( "gl-Canvas" );
    gl = WebGLUtils.setupWebGL( canvas );

    if ( !gl ){
      alert("WebGL not available");
    }

    gl.viewport(0,0,canvas.width, canvas.height);
    aspect = canvas.width / canvas.height;
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);


    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    gl.program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( gl.program );

    gl.nBuffer = null;
    gl.vBuffer = null;

    var incrementBtn = document.getElementById("buttonInc");
    var decrementBtn = document.getElementById("buttonDec");
    var orbitBtn = document.getElementById("orbit");
    var slider_le = document.getElementById("slide_le");
    var slider_kd = document.getElementById("slide_kd");
    var slider_ka = document.getElementById("slide_ka");
    var slider_ks = document.getElementById("slide_ks");
    var slider_alpha = document.getElementById("slide_alpha");

    orbitBtn.onclick = function(){ orbit = !orbit; };
    slider_le.addEventListener("input", function(event) { Le = event.target.value; });
    slider_kd.addEventListener("input", function(event) { kd =  vec4(event.target.value,event.target.value,event.target.value,1.0); });
    slider_ka.addEventListener("input", function(event) { ka =  vec4(event.target.value,event.target.value,event.target.value,1.0); });
    slider_ks.addEventListener("input", function(event) { ks =  vec4(event.target.value,event.target.value,event.target.value,1.0); });
    slider_alpha.addEventListener("input", function(event) { alpha =  event.target.value; });


    model = initObject(gl, "plane.obj", scale);

    modelViewMatrixLoc = gl.getUniformLocation( gl.program, "modelView" );
    projection = gl.getUniformLocation( gl.program, "projection" );


    render();

}

var render = function(){
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (orbit){ theta += 0.02;  }

    var eye = vec3(radius * Math.sin(theta), 0, radius * Math.cos(theta));

    var at = vec3(0.0, 0.0, 0.0);
    var up = vec3(0.0, 1.0, 0.0);

    mvMatrix = lookAt(eye, at , up);
    pMatrix = perspective(fovy, 1.0, near, far);

    nMatrix = normalMatrix(mvMatrix,true);

    gl.uniform4fv( gl.getUniformLocation(gl.program,"ka"), flatten(ka) );
    gl.uniform1f( gl.getUniformLocation(gl.program,"Le"), Le );
    gl.uniform4fv( gl.getUniformLocation(gl.program,"kd"), flatten(kd) );
    gl.uniform4fv( gl.getUniformLocation(gl.program,"ks"), flatten(ks) );
    gl.uniform1f( gl.getUniformLocation(gl.program,"alpha"), alpha );

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mvMatrix) );
    gl.uniformMatrix4fv(projection, false, flatten(pMatrix) );


    if (!g_drawingInfo && g_objDoc && g_objDoc.isMTLComplete()) {
      // OBJ and all MTLs are available
      g_drawingInfo = onReadComplete(gl, model, g_objDoc);
    }
    if (!g_drawingInfo){
      requestAnimationFrame(render);
      return;
    } else {
        gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
        requestAnimationFrame(render);
    }
}
