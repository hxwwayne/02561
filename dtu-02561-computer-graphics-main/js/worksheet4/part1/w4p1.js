var gl;
var points = [];
var colors = [];
var numVertices;

var numTimesToSubdivide = 6;
var index = 0;
var pointsArray = [];
var normalsArray = [];

var near = 1;
var far = 10;
var fovy = 45.0;
var aspect;

var mvMatrix, pMatrix;
var modelView, projection, modelViewMatrix;
var modelLocation, loc, normalMatrixLoc;
var eye;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

var va = vec4(0.0, 0.0, -1.0, 1);
var vb = vec4(0.0, 0.942809, 0.333333, 1);
var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
var vd = vec4(0.816497, -0.471405, 0.333333, 1);

window.onload = function init(){
  canvas = document.getElementById("gl-Canvas");
  gl = WebGLUtils.setupWebGL(canvas);

  if(!gl){
    alert("WebGL not available");
  }

   gl.viewport( 0, 0, canvas.width, canvas.height );
   aspect =  canvas.width/canvas.height;
   gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

   gl.enable(gl.DEPTH_TEST);

   var program = initShaders( gl, "vertex-shader", "fragment-shader" );
   gl.useProgram( program );

   tetrahedron(va, vb, vc, vd, numTimesToSubdivide);

   // indices buffer
   var iBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
   gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(normalsArray), gl.STATIC_DRAW);

   var cBuffer = gl.createBuffer();
   gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
   gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

   var vColor = gl.getAttribLocation( program, "vColor" );
   gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
   gl.enableVertexAttribArray( vColor );

   var vBuffer = gl.createBuffer();
   //vBuffer = null;
   gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
   gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );

   var vPosition = gl.getAttribLocation( program, "vPosition" );
   gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
   gl.enableVertexAttribArray( vPosition );

   modelView = gl.getUniformLocation( program, "modelView" );
   projection = gl.getUniformLocation( program, "projection" );
   modelLocation = gl.getUniformLocation(program, "modelLocation");
   normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );

   var increment = document.getElementById("buttonInc");
   var decrement = document.getElementById("buttonDec");

   increment.onclick = function(){
     console.log("incrementing");
      numTimesToSubdivide++;
      index = 0;
      pointsArray = [];
      normalsArray = [];
      init();

    };

    decrement.onclick = function(){
      console.log("decrementing");
        if(numTimesToSubdivide) numTimesToSubdivide--;
        index = 0;
        pointsArray = [];
        normalsArray = [];
        init();
    };

   render();
};

function tetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}

function divideTriangle(a, b, c, count) {
    if ( count > 0 ) {

        var ab = mix( a, b, 0.5);
        var ac = mix( a, c, 0.5);
        var bc = mix( b, c, 0.5);

        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);

        divideTriangle( a, ab, ac, count - 1 );
        divideTriangle( ab, b, bc, count - 1 );
        divideTriangle( bc, c, ac, count - 1 );
        divideTriangle( ab, bc, ac, count - 1 );
    }
    else {
        triangle( a, b, c );
    }
}

function triangle(a, b, c) {
     pointsArray.push(a);
     pointsArray.push(b);
     pointsArray.push(c);
     normalsArray.push(a[0],a[1], a[2], 0.0);
     normalsArray.push(b[0],b[1], b[2], 0.0);
     normalsArray.push(c[0],c[1], c[2], 0.0);

     index += 3;
}

function render() {

  gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  eye = vec3(0.0,0.0,0.0);
  mvMatrix = lookAt(eye, at , up);
  pMatrix = perspective(fovy, aspect, near, far);
  loc = translate(0.0, 0.0, -1.8);
  var viewMatrix = mult(loc, mvMatrix);
  gl.uniformMatrix4fv(modelLocation, false, flatten(loc));
  gl.uniformMatrix4fv( modelView, false, flatten(viewMatrix) );
  gl.uniformMatrix4fv( projection, false, flatten(pMatrix) );

  for( var i=0; i<index; i+=3)
          gl.drawArrays( gl.TRIANGLES, i, 3 );

};
