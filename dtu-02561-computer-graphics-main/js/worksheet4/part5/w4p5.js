var gl;
var canvas;
var points = [];
var colors = [];

var numTimesToSubdivide = 6;
var index = 0;
var pointsArray = [];
var normalsArray = [];

var near = 1;
var far = 10;
var fovy = 45.0;
var aspect;

var radius = 2;
var theta  = 0.0;

var mvMatrix, pMatrix;
var modelViewMatrixLoc, projection, normalMatrixLoc;

var orbit = true;

var va = vec4(0.0, 0.0, 1.0,1);
var vb = vec4(0.0, 0.942809, -0.333333, 1);
var vc = vec4(-0.816497, -0.471405, -0.333333, 1);
var vd = vec4(0.816497, -0.471405, -0.333333,1);

var lightPosition = vec4(0.0, 0.0, 1.0, 0.0 );
var Le = 2.5;
var Li = vec4(0.75, 0.75, 0.75, 0.75);
var kd = vec4(0.5, 0.5, 0.5, 0.5);
var ka = vec4(0.1, 0.1, 0.1, 0.1);
var ks = vec4(0.25, 0.25, 0.25, 0.25);
var alpha = 75.0;


function createSphere(gl,numTimesToSubdivide){

    gl.deleteBuffer(gl.nBuffer);
    gl.deleteBuffer(gl.vBuffer);

    tetrahedron(va,vb,vc,vd, numTimesToSubdivide);

    gl.nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, gl.nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );

    var vNormal = gl.getAttribLocation( gl.program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal);

    gl.vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation( gl.program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    modelViewMatrixLoc = gl.getUniformLocation( gl.program, "modelView" );
    projection = gl.getUniformLocation( gl.program, "projection" );
    normalMatrixLoc = gl.getUniformLocation( gl.program, "nMatrix" );

    gl.uniform4fv( gl.getUniformLocation(gl.program,"Li"),flatten(Li) );
    gl.uniform4fv( gl.getUniformLocation(gl.program,"kd"),flatten(kd) );
    gl.uniform4fv( gl.getUniformLocation(gl.program,"ka"),flatten(ka) );
    gl.uniform4fv( gl.getUniformLocation(gl.program,"ks"),flatten(ks) );
    gl.uniform1f( gl.getUniformLocation(gl.program,"alpha"), alpha );
    gl.uniform1f( gl.getUniformLocation(gl.program,"Le"), Le );
    gl.uniform4fv( gl.getUniformLocation(gl.program,"lightPosition"),flatten(lightPosition) );

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

    createSphere(gl,numTimesToSubdivide);

    var incrementBtn = document.getElementById("buttonInc");
    var decrementBtn = document.getElementById("buttonDec");
    var orbitBtn = document.getElementById("orbit");
    var slider_le = document.getElementById("slide_le");
    var slider_kd = document.getElementById("slide_kd");
    var slider_ka = document.getElementById("slide_ka");
    var slider_ks = document.getElementById("slide_ks");
    var slider_alpha = document.getElementById("slide_alpha");

    incrementBtn.onclick = function(){
        if(numTimesToSubdivide < 6) numTimesToSubdivide++;
        pointsArray = [];
        normalsArray = [];
        createSphere(gl,numTimesToSubdivide)
    };
    decrementBtn.onclick = function(){
        if(numTimesToSubdivide > 0) numTimesToSubdivide--;
        pointsArray = [];
        normalsArray = [];
        createSphere(gl,numTimesToSubdivide)
    };

    orbitBtn.onclick = function(){ orbit = !orbit; };
    slider_le.addEventListener("input", function(event) { Le = event.target.value; });
    slider_kd.addEventListener("input", function(event) { kd =  vec4(event.target.value,event.target.value,event.target.value,1.0); });
    slider_ka.addEventListener("input", function(event) { ka =  vec4(event.target.value,event.target.value,event.target.value,1.0); });
    slider_ks.addEventListener("input", function(event) { ks =  vec4(event.target.value,event.target.value,event.target.value,1.0); });
    slider_alpha.addEventListener("input", function(event) { alpha =  event.target.value; });

    render();

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

var render = function(){
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (orbit){ theta += 0.02;  }

    var eye = vec3(radius * Math.sin(theta), 0, radius * Math.cos(theta));

    const at = vec3(0.0, 0.0, 0.0);
    const up = vec3(0.0, 1.0, 0.0);

    mvMatrix = lookAt(eye, at , up);
    pMatrix = perspective(fovy, aspect, near, far);
    loc = translate(0.0,0.0,-1.8);
    var viewMatrix = mult(loc, mvMatrix);

    gl.uniform4fv( gl.getUniformLocation(gl.program,"ka"), flatten(ka) );
    gl.uniform1f( gl.getUniformLocation(gl.program,"Le"), Le );
    gl.uniform4fv( gl.getUniformLocation(gl.program,"kd"), flatten(kd) );
    gl.uniform4fv( gl.getUniformLocation(gl.program,"ks"), flatten(ks) );
    gl.uniform1f( gl.getUniformLocation(gl.program,"alpha"), alpha );

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(viewMatrix) );
    gl.uniformMatrix4fv(projection, false, flatten(pMatrix) );

    for( var i=0; i<pointsArray.length; i+=3){
        gl.drawArrays( gl.TRIANGLES, i, 3 );
    }
   requestAnimationFrame(render);
}
