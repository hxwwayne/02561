var gl;
var canvas;
var points = [];
var colors = [];

var numTimesToSubdivide = 4;
var index = 0;
var pointsArray = [];
var normalsArray = [];

var near = 1;
var far = 10;
var fovy = 45.0;
var aspect;

var radius = 5;
var theta  = 0.0;

var mvMatrix, pMatrix;
var modelViewMatrixLoc, projection, normalMatrixLoc, texLoc;


var orbit = true;

var va = vec4(0.0, 0.0, 1.0,1);
var vb = vec4(0.0, 0.942809, -0.333333, 1);
var vc = vec4(-0.816497, -0.471405, -0.333333, 1);
var vd = vec4(0.816497, -0.471405, -0.333333,1);

var lightPosition = vec4(0.0, 0.0, 1.0, 0.0 );
var Le = 1.2;
var Li = vec4(1.0, 1.0, 1.0, 1.0);
var kd = vec4(0.6, 0.6, 0.6, 1.0);
var ka = vec4(0.1, 0.1, 0.1, 1.0);
var ks = vec4(0.3, 0.3, 0.3, 1.0);
var alpha = 25.0;

var g_tex_ready = 0;

bg = [
	vec4(-1.0, -1.0, 0.999, 1.0),
	vec4( 1.0, -1.0, 0.999, 1.0),
	vec4( 1.0,  1.0, 0.999, 1.0),
	vec4(-1.0, -1.0, 0.999, 1.0),
	vec4( 1.0,  1.0, 0.999, 1.0),
	vec4(-1.0,  1.0, 0.999, 1.0)];

bg.forEach(point => { pointsArray.push(point); });


function initTexture(gl)
{
   var cubemap = ['../assets/textures/cm_left.png', // POSITIVE_X
   '../assets/textures/cm_right.png', // NEGATIVE_X
   '../assets/textures/cm_top.png', // POSITIVE_Y
   '../assets/textures/cm_bottom.png', // NEGATIVE_Y
   '../assets/textures/cm_back.png', // POSITIVE_Z
   '../assets/textures/cm_front.png']; // NEGATIVE_Z

   gl.activeTexture(gl.TEXTURE0);
   var texture = gl.createTexture();
   gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
   gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

   for(var i = 0; i < 6; ++i) {
     var image = document.createElement('img');
     image.crossorigin = 'anonymous';
     image.textarget = gl.TEXTURE_CUBE_MAP_POSITIVE_X + i;

     image.onload = function(event) {
       var image = event.target;
       gl.activeTexture(gl.TEXTURE0);
       gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
       gl.texImage2D(image.textarget, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
       ++g_tex_ready;
     };
   image.src = cubemap[i];
   }

   gl.uniform1i(gl.getUniformLocation(gl.program, "texMap"), 0);
}

function createSphere(gl, numTimesToSubdivide){

  gl.deleteBuffer(gl.nBuffer);
  gl.deleteBuffer(gl.vBuffer);

	tetrahedron(va, vb, vc, vd, numTimesToSubdivide);

	gl.vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, gl.vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

  gl.vertexAttribPointer(gl.getAttribLocation(gl.program, 'vPosition'), 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(gl.getAttribLocation(gl.program, 'vPosition'));

  gl.uniform4fv( gl.getUniformLocation(gl.program,"Li"),flatten(Li) );
  gl.uniform4fv( gl.getUniformLocation(gl.program,"kd"),flatten(kd) );
  gl.uniform4fv( gl.getUniformLocation(gl.program,"ka"),flatten(ka) );
  gl.uniform4fv( gl.getUniformLocation(gl.program,"ks"),flatten(ks) );
  gl.uniform1f( gl.getUniformLocation(gl.program,"alpha"), alpha );
  gl.uniform1f( gl.getUniformLocation(gl.program,"Le"), Le );
  gl.uniform4fv( gl.getUniformLocation(gl.program,"lightPosition"),flatten(lightPosition) );

}

window.onload = function init(){
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

	initTexture(gl)
	createSphere(gl, numTimesToSubdivide);
	render();

}


	var render = function(){
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (orbit){ theta += 0.02;  }

    var eye = vec3(radius * Math.sin(theta), 0, radius * Math.cos(theta));

    const at = vec3(0.0, 0.0, 0.0);
    const up = vec3(0.0, 1.0, 0.0);

  	mvMatrix = lookAt(eye, at, up);
    pMatrix = perspective(fovy, aspect, near, far);

  	modelViewMatrixLoc = gl.getUniformLocation(gl.program, "modelView");
  	texLoc = gl.getUniformLocation(gl.program, "texMatrix");

    gl.uniform4fv( gl.getUniformLocation(gl.program,"ka"), flatten(ka) );
    gl.uniform1f( gl.getUniformLocation(gl.program,"Le"), Le );
    gl.uniform4fv( gl.getUniformLocation(gl.program,"kd"), flatten(kd) );
    gl.uniform4fv( gl.getUniformLocation(gl.program,"ks"), flatten(ks) );
    gl.uniform1f( gl.getUniformLocation(gl.program,"alpha"), alpha );

  	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mat4()));
  	gl.uniformMatrix4fv(texLoc, false, flatten(mult(inverse4(mvMatrix), inverse4(pMatrix))));
  	gl.drawArrays(gl.TRIANGLES, 0, bg.length);

  	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mult(pMatrix, mvMatrix)));
  	gl.uniformMatrix4fv(texLoc, false, flatten(mat4()));
  	gl.drawArrays(gl.TRIANGLES, bg.length, pointsArray.length - bg.length);

		requestAnimationFrame(render)
}


function tetrahedron(a, b, c, d, n){
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}

function divideTriangle(a,b,c,count){
    if (count > 0){
        var ab = mix( a, b, 0.5);
        var ac = mix( a, c, 0.5);
        var bc = mix( b, c, 0.5);

        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);

        divideTriangle( a, ab, ac, count - 1);
        divideTriangle( ab, b, bc, count - 1);
        divideTriangle( bc, c, ac, count - 1);
        divideTriangle( ab, bc, ac, count - 1);
    }
    else {
        triangle( a, b, c );
    }
}

function triangle(a, b, c){
    pointsArray.push(a);
    pointsArray.push(b);
    pointsArray.push(c);

    normalsArray.push(vec4(a[0],a[1], a[2], 0.0));
    normalsArray.push(vec4(b[0],b[1], b[2], 0.0));
    normalsArray.push(vec4(c[0],c[1], c[2], 0.0));

    index += 3;
}
