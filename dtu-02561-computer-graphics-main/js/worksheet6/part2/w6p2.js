var canvas;
var gl;

var near = 0.1;
var far = 50;
var fovy = 90.0;

var radius = 2;
var theta  = 0.0;
var scale = 0.2;

var mvMatrix, projection;
var viewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;

var texSize = 64;
var numRows = 4;
var numCols = 4;

var myTexels = new Uint8Array(4*texSize*texSize);
var indices = [0, 1, 2, 0, 2, 3];

var texCoord = [
    vec2(-1.5, 0.0),
    vec2(2.5, 0.0),
    vec2(2.5, 10.0),
    vec2(-1.5, 10.0)
];

var vertices = [
  vec3( -4.0, -1.0, -1.0 ),
  vec3(  4.0, -1.0, -1.0 ),
  vec3(  4.0, -1.0, -21.0),
  vec3( -4.0, -1.0, -21.0)
];

for (var i = 0; i < texSize; ++i){
    for(var j = 0; j < texSize; ++j){
        var patchx = Math.floor(i/(texSize/numRows));
        var patchy = Math.floor(j/(texSize/numCols));
        var c = (patchx%2 ^ patchy%2 ? 255 : 0);
        myTexels[4*i*texSize+4*j] = c;
        myTexels[4*i*texSize+4*j+1] = c;
        myTexels[4*i*texSize+4*j+2] = c;
        myTexels[4*i*texSize+4*j+3] = c;
    }
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

    var repeatBtn = document.getElementById("repeatBtn");
    var clampBtn = document.getElementById("clampBtn");
    var nearestBtn = document.getElementById("nearestBtn");
    var linearBtn = document.getElementById("linearBtn");
    var mipmapBtn = document.getElementById("mipmapBtn");

    clampBtn.onclick = function(){
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      render();
    };

    repeatBtn.onclick = function(){
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      render();
    };

    nearestBtn.onclick = function(){
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      render();
    };

    linearBtn.onclick = function(){
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      render();
    };

    mipmapBtn.onclick = function(){
      gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
      gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      render();
    };


    gl.program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( gl.program );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(gl.program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoord), gl.STATIC_DRAW);

    var vTexCoords = gl.getAttribLocation( gl.program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoords, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoords);

    var texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, myTexels);
    gl.uniform1i(gl.getUniformLocation(gl.program, "texture"), 0);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);

    viewMatrixLoc = gl.getUniformLocation( gl.program, "modelView" );
    projectionMatrixLoc = gl.getUniformLocation( gl.program, "projection" );

    render();

}

var render = function(){
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var eye = vec3(0.0,0.0,0.0);
    var at = vec3(0.0, 0.0, 0.0);
    var up = vec3(0.0, 0.0, 0.0);

    mvMatrix = lookAt(eye, at , up);
    projection = perspective(fovy, 1.0, near, far);

    gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(mvMatrix) );
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projection) );

    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);

}
