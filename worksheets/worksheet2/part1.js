var vertices = [];

window.onload = function init()
{
    canvas = document.getElementById('canvas')
    gl = WebGLUtils.setupWebGL(canvas)
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.3921, 0.5843, 0.9294, 1.0);

    program = initShaders(gl, 'vertex-shader', 'fragment-shader');
    gl.useProgram(program);
    // var vertices = [vec2(0.0, 0.0), vec2(1.0, 1.0), vec2(1.0, 0.0)];
    // var vBuffer = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    // gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    // var vPosition = gl.getAttribLocation(program, 'a_Position');
    // gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    // gl.enableVertexAttribArray(vPosition);
    canvas.addEventListener('click', function(event) {
        var rect = event.target.getBoundingClientRect();
        var x = event.clientX - rect.left; // x position within the element.
        var y = event.clientY - rect.top;  // y position within the element.
        
        // Convert from canvas to WebGL coordinates
        var x_canvas = 2 * (x / canvas.width) - 1;
        var y_canvas = 2 * ((canvas.height - y) / canvas.height) - 1;

        vertices.push(vec2(x_canvas, y_canvas));
        var vBuffer = gl.createBuffer();
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