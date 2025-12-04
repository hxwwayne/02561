var gl, program;
var vertices = [];
var colors = [];
var clearColor = [0.3921, 0.5843, 0.9294, 1.0];
var currentPointColor = { r: 255, g: 0, b: 0 };
var drawingMode = 'points';  
var pointBuffer, colorBuffer;
var tempVertices = [];

window.onload = function init()
{
    canvas = document.getElementById('canvas')
    gl = WebGLUtils.setupWebGL(canvas)
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    program = initShaders(gl, 'vertex-shader', 'fragment-shader');
    gl.useProgram(program);


    pointBuffer = gl.createBuffer();
    colorBuffer = gl.createBuffer();

    setupEventListeners();



    render(vertices.length);
}

function render(length) {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, length/2);
}

function hexToRgb(hex) {
    var r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);
    return { r: r, g: g, b: b };
}

function clearCanvas() {
    gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
    gl.clear(gl.COLOR_BUFFER_BIT);
    vertices = [];
    colors = [];
}

function setupEventListeners() {
    document.getElementById("clearColor").addEventListener("change", function(event) {
        var hex = hexToRgb(event.target.value);
        clearColor = [hex.r / 255, hex.g / 255, hex.b / 255, 1.0];
        clearCanvas();
    });

    document.getElementById("pointColor").addEventListener("change", function(event) {
        currentPointColor = hexToRgb(event.target.value);
    });

    document.getElementById('canvas').addEventListener('click', function(event) {
        handleCanvasClick(event);
    });
}

function handleCanvasClick(event) {
    var rect = event.target.getBoundingClientRect();
    var x = 2 * ((event.clientX - rect.left) / canvas.width) - 1;
    var y = 2 * ((canvas.height - (event.clientY - rect.top)) / canvas.height) - 1;

    if (drawingMode === 'points') {
        // Each point is represented by two triangles to form a square
        addPointAsSquare(x, y);
    } else if (drawingMode === 'triangles') {
        // Collect three points to form a triangle
        tempVertices.push(x, y);
        if (tempVertices.length === 6) {  // Three points
            vertices.push(...tempVertices);
            colors.push(...Array(6).fill([currentPointColor.r / 255, currentPointColor.g / 255, currentPointColor.b / 255]));
            tempVertices = [];
        }
    }
    updateBuffers();
    render(vertices.length);
}

function addPointAsSquare(x, y) {
    // Approximate a point by a small square (2 triangles)
    var size = 0.02;  // Size of the square
    vertices.push(x-size, y-size, x+size, y-size, x-size, y+size); // First triangle
    vertices.push(x-size, y+size, x+size, y-size, x+size, y+size); // Second triangle
    for (let i = 0; i < 6; i++) { // Color for each vertex
        colors.push([currentPointColor.r / 255, currentPointColor.g / 255, currentPointColor.b / 255]);
    }
}

function updateBuffers() {
    gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    var vPosition = gl.getAttribLocation(program, 'a_Position');
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors.flat()), gl.STATIC_DRAW);
    var vColor = gl.getAttribLocation(program, 'a_Color');
    gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);
}

function setMode(mode) {
    drawingMode = mode;
    clearCanvas();  // Clear the canvas when mode changes
}
