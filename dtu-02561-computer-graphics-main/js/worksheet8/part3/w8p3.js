var canvas;
var gl;

var near = 0.1;
var far = 50;
var fovy = 75.0;

var radius = 2;
var theta  = 0.0;
var scale = 0.2;

var mvMatrix, projection;
var viewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;
var textureLoc_1, textureLoc_2;

var orbit = true;
var image;

var lightX;
var lightY;
var groundY = -1.001;

var translate_l1;
var translate_l2;
var visibility;


var vertices = [
  //ground
  vec3(-2, -1, -1),
  vec3(2, -1, -1),
  vec3(2, -1, -5),
  vec3(-2, -1, -5),
  //q2
  vec3(0.25, -0.5, -1.25),
  vec3(0.75, -0.5, -1.25),
  vec3(0.75, -0.5, -1.75),
  vec3(0.25, -0.5, -1.75),
  //q1
  vec3(-1, -1, -2.5),
  vec3(-1, 0, -2.5),
  vec3(-1, 0, -3),
  vec3(-1, -1, -3)
];

var d = -(radius - (groundY));

var shadowProjection = mat4(
  1, 0,   0, 0,
  0, 1,   0, 0,
  0, 0,   1, 0,
  0, 1/d, 0, 0
);

texCoord = [
  //ground
  vec2(-1, -1),
  vec2(-1, 1),
  vec2(1, 1),
  vec2(1, -1),
  //q1
  vec2(-1, -1),
  vec2(-1, 1),
  vec2(1, 1),
  vec2(1, -1),
  //q2
  vec2(-1, -1),
  vec2(-1, 1),
  vec2(1, 1),
  vec2(1, -1)
];

var indices = [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11];

image = document.createElement('img');
image.crossorigin = 'anonymous';
image.src = '../assets/xamp23.png';

window.onload = function init() {
    canvas = document.getElementById( "gl-Canvas" );
    gl = WebGLUtils.setupWebGL( canvas );

    if ( !gl ){
      alert("WebGL not available");
    }

    gl.viewport(0,0,canvas.width, canvas.height);
    aspect = canvas.width / canvas.height;
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    gl.program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(gl.program);

    gl.nBuffer = null;
    gl.vBuffer = null;

    var orbitBtn = document.getElementById("orbit");
    orbitBtn.onclick = function(){ orbit = !orbit; };

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



    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    textureLoc_1 = gl.getUniformLocation( gl.program, "texture");
    gl.uniform1i(textureLoc_1, 0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    textureLoc_2 = gl.getUniformLocation( gl.program, "texture");
    gl.uniform1i(textureLoc_2, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([255, 0, 0]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);

    viewMatrixLoc = gl.getUniformLocation(gl.program, "mvMatrix");
    projectionMatrixLoc = gl.getUniformLocation(gl.program, "projection");
    visibility = gl.getUniformLocation(gl.program, "visibility");

    render();
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    if (orbit){ theta += 0.02;  }
    lightX = 2 * Math.sin(theta);
    lightY = -2 + 2 * Math.cos(theta);

    var eye = vec3(0.0, 0.0, 0.0);
    var at = vec3(0.0, 0.0, 0.0);
    var up = vec3(0.0, 1.0, 0.0);

    mvMatrix = lookAt(eye, at, up);
    projection = perspective(fovy, 1.0, near, far);

    gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(mvMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projection));
    gl.uniform1i(textureLoc_1, 0);
    gl.uniform1i(visibility,1);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);

    gl.depthFunc(gl.GREATER)

    translate_l1  = translate(lightX, radius, lightY);
    translate_l2  = translate(-lightX, -radius, -lightY);

    mvMatrix = [translate_l1, shadowProjection, translate_l2, lookAt(eye, at, up)].reduce(mult);
    gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(mvMatrix));
    gl.uniform1i(textureLoc_2, 1);

    gl.uniform1i(visibility,0);
    gl.drawElements(gl.TRIANGLES, 12, gl.UNSIGNED_BYTE, 6);

    gl.depthFunc(gl.LESS)

    mvMatrix = lookAt(eye, at, up);
    gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(mvMatrix));
    gl.uniform1i(textureLoc_2, 1);

    gl.uniform1i(visibility,1);
    gl.drawElements(gl.TRIANGLES, 12, gl.UNSIGNED_BYTE, 6);

    window.requestAnimFrame(render);
}
