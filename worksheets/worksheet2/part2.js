var gl, program;
var vertices = [];
var colors = [];
var clearColor = [0.3921, 0.5843, 0.9294, 1.0];
var currentPointColor = { r: 255, g: 0, b: 0 };

window.onload = function init()
{
    canvas = document.getElementById('canvas')
    gl = WebGLUtils.setupWebGL(canvas)
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    program = initShaders(gl, 'vertex-shader', 'fragment-shader');
    gl.useProgram(program);

    document.getElementById("clearColor").addEventListener("change", function(event) {
        var hex = hexToRgb(event.target.value);
        clearColor = [hex.r / 255, hex.g / 255, hex.b / 255, 1.0];
        clearCanvas();
    });

    document.getElementById("pointColor").addEventListener("change", function(event) {
        currentPointColor = hexToRgb(event.target.value);
    });

    var cBuffer = gl.createBuffer();
    var vBuffer = gl.createBuffer();

    canvas.addEventListener('click', function(event) {
        var rect = event.target.getBoundingClientRect();
        var x = event.clientX - rect.left; // x position within the element.
        var y = event.clientY - rect.top;  // y position within the element.
        
        // Convert from canvas to WebGL coordinates
        var x_canvas = 2 * (x / canvas.width) - 1;
        var y_canvas = 2 * ((canvas.height - y) / canvas.height) - 1;

        vertices.push(vec2(x_canvas, y_canvas));
        colors.push([currentPointColor.r / 255, currentPointColor.g / 255, currentPointColor.b / 255]);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

        var vColor = gl.getAttribLocation(program, 'a_Color');
        gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vColor);

        
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer); 
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW); 

        var vPosition = gl.getAttribLocation(program, 'a_Position');
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);
        
        render(vertices.length);
    });



    render(vertices.length);
}

function render(length) {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, length);
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