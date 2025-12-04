async function main() {
    const gpu = navigator.gpu;
    const adapter = await gpu.requestAdapter();
    const device = await adapter.requestDevice();
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('webgpu');
    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device: device,
        format: format,
        // alphaMode: 'opaque',
    });
    const shaderCode = await fetch('part1.wgsl').then(r => r.text());
    const shaderModule = device.createShaderModule({code: shaderCode});
    // --------------------------- set up geometry data ---------------------------
    let vertices = [
        vec3(-4.0, -1.0, -1.0),
        vec3(4.0, -1.0, -1.0),
        vec3(4.0, -1.0, -21.0),
        vec3(-4.0, -1.0, -21.0),
    ];

    let indices = new Uint32Array([0, 1, 2, 0, 2, 3]);

    const texture_coords = [
        vec2(-1.5, 0.0),
        vec2(2.5, 0.0),
        vec2(2.5, 10.0),
        vec2(-1.5, 10.0),
    ];

    const vertexBuffer = device.createBuffer({
        size: vertices.length * sizeof['vec3'],
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    const indexBuffer = device.createBuffer({
        size: indices.length * Uint32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });

    const textureCoordBuffer = device.createBuffer({
        size: texture_coords.length * sizeof['vec2'],
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    const vertexBufferLayout = {
        arrayStride: sizeof['vec3'],
        attributes: [{
            shaderLocation: 0,
            offset: 0,
            format: 'float32x3',
        }],
    };
    
    const textureCoordBufferLayout = {
        arrayStride: sizeof['vec2'],
        attributes: [{
            shaderLocation: 1,
            offset: 0,
            format: 'float32x2',
        }],
    };

    device.queue.writeBuffer(vertexBuffer, 0, flatten(vertices));
    device.queue.writeBuffer(indexBuffer, 0, indices);
    device.queue.writeBuffer(textureCoordBuffer, 0, flatten(texture_coords));

    // --------------------------- set up checkerboard texture ---------------------------
    const texsize = 64;
    var checkerboard = new Uint8Array(4 * texsize * texsize);
    const numRows = 8;
    const numCols = 8;
    for (var i = 0; i < texsize; ++i) {
        for (var j = 0; j < texsize; ++j) {
            var patchx = Math.floor(i / (texsize / numRows));
            var patchy = Math.floor(j / (texsize / numCols));
            var c = (patchx % 2 == patchy % 2) ? 255 : 0;
            var idx = 4 * (i * texsize + j);
            checkerboard[idx] = checkerboard[idx + 1] = checkerboard[idx + 2] = c;
            checkerboard[idx + 3] = 255;
        }
    }

    var texture = device.createTexture({
        format: 'rgba8unorm',
        size: [texsize, texsize, 1],
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    device.queue.writeTexture(
        { texture}, checkerboard,
        { offset: 0, bytesPerRow: 4 * texsize, rowsPerImage: texsize },
        [ texsize, texsize, 1 ]
    );
    texture.sampler = device.createSampler({
        addressModeU: "clamp-to-edge",
        addressModeV: "repeat",
        minFilter: "nearest",
        magFilter: "linear",
        mipmapFilter: "nearest"
    });

    const Mst = mat4(
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 0.5, 0.5,
        0.0, 0.0, 0.0, 1.0
    );
    const projection = perspective(45, canvas.width / canvas.height, 0.1, 100);
    const p = mult(Mst, projection);
    const view = mat4();
    const pv = mult(p, view);
    const M_center = translate(0.0, 0.0, 0.0);
    const mvp = mult(pv, M_center);

    const uniformBuffer = device.createBuffer({
        size: sizeof['mat4'],
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(uniformBuffer, 0, flatten(mvp));

    const msaaCount = 4;
    const msaaColorTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        sampleCount: msaaCount,
        format: format,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    const depthTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: 'depth24plus',
        sampleCount: msaaCount,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });


    const pipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: {
            module: shaderModule,
            entryPoint: 'vs_main',
            buffers: [vertexBufferLayout, textureCoordBufferLayout],
        },
        fragment: {
            module: shaderModule,
            entryPoint: 'fs_main',
            targets: [{ format: format }],
        },
        primitive: {
            topology: 'triangle-list',
            cullMode: 'back', 
            frontFace: 'ccw',
        },
        depthStencil: {
            format: 'depth24plus',
            depthWriteEnabled: true,
            depthCompare: 'less',
        },
        multisample: {
            count: msaaCount,
        },
    });

    const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: uniformBuffer } },
            { binding: 1, resource: texture.sampler },
            { binding: 2, resource: texture.createView() },
        ],
    });

    function render() {
        const encoder = device.createCommandEncoder();
        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                view: msaaColorTexture.createView(),
                resolveTarget: context.getCurrentTexture().createView(),
                loadOp: 'clear',
                storeOp: 'store',
                clearValue: { r: 0.4, g: 0.6, b: 0.9, a: 1.0 },
            }],
            depthStencilAttachment: {
                view: depthTexture.createView(),
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
                depthClearValue: 1.0,
            },
        });

        pass.setPipeline(pipeline);
        pass.setVertexBuffer(0, vertexBuffer);
        pass.setVertexBuffer(1, textureCoordBuffer);
        pass.setIndexBuffer(indexBuffer, 'uint32');
        pass.setBindGroup(0, bindGroup);
        pass.drawIndexed(indices.length);
        pass.end();
        device.queue.submit([encoder.finish()]);
    }

    render();

}

window.onload = main;
