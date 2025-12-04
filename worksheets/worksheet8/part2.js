
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
    const shaderCode = await fetch('part2.wgsl').then(r => r.text());
    const shaderModule = device.createShaderModule({code: shaderCode});
    // --------------------------- set up geometry data ---------------------------
    const vertices = [
        // Ground
        vec3(-2.0, -1.0, -1.0),  // v0
        vec3( 2.0, -1.0, -1.0),  // v1
        vec3( 2.0, -1.0, -5.0),  // v2
        vec3(-2.0, -1.0, -5.0),  // v3

        // parallel to ground red quad:
        // y = -0.5, x in [0.25, 0.75], z in [-1.25, -1.75]
        vec3(0.25, -0.5, -1.25), // v4
        vec3(0.75, -0.5, -1.25), // v5
        vec3(0.75, -0.5, -1.75), // v6
        vec3(0.25, -0.5, -1.75), // v7

        // Vertical red quad: x = -1, y in [-1, 0], z in [-2.5, -3.0]
        vec3(-1.0, -1.0, -2.5),  // v8
        vec3(-1.0, -1.0, -3.0),  // v9
        vec3(-1.0,  0.0, -3.0),  // v10
        vec3(-1.0,  0.0, -2.5),  // v11
    ];

    const indices = new Uint32Array([
        // Ground
        0, 1, 2, 0, 2, 3,
        // parallel to ground red quad
        4, 5, 6, 4, 6, 7,
        // Vertical red quad
        8, 9, 10, 8, 10, 11,
    ]);

    const texture_coords = [
        // Ground
        vec2(0.0, 0.0),
        vec2(1.0, 0.0),
        vec2(1.0, 1.0),
        vec2(0.0, 1.0),

        // parallel to ground red quad
        vec2(0.0, 0.0),
        vec2(1.0, 0.0),
        vec2(1.0, 1.0),
        vec2(0.0, 1.0),

        // Vertical red quad
        vec2(0.0, 0.0),
        vec2(1.0, 0.0),
        vec2(1.0, 1.0),
        vec2(0.0, 1.0),
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

    // --------------------------- set up texture ---------------------------
    const filename = 'xamp23.png';
    const response = await fetch(filename);
    const blob = await response.blob();
    const img = await createImageBitmap(blob);

    const textureGround = device.createTexture({
        size: [img.width, img.height, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    });
    device.queue.copyExternalImageToTexture(
        { source: img },
        { texture: textureGround },
        [img.width, img.height]
    );

    textureGround.sampler = device.createSampler({
        addressModeU: "clamp-to-edge",
        addressModeV: "clamp-to-edge",
        minFilter: "linear",
        magFilter: "linear",
    });

    const textureRed = device.createTexture({
        size: [1, 1, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    const redPixel = new Uint8Array([255, 0, 0, 255]);
    device.queue.writeTexture(
        { texture: textureRed }, redPixel,
        { offset: 0, bytesPerRow: 4, rowsPerImage: 1 },
        [1, 1, 1]
    );
    textureRed.sampler = device.createSampler({
        addressModeU: "clamp-to-edge",
        addressModeV: "clamp-to-edge",
        minFilter: "nearest",
        magFilter: "nearest",
    });


    const Mst = mat4(
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 0.5, 0.5,
        0.0, 0.0, 0.0, 1.0
    );
    const projection = perspective(90, canvas.width / canvas.height, 0.1, 100);
    const p = mult(Mst, projection);
    const view = mat4();
    const pv = mult(p, view);
    const M_center = translate(0.0, 0.0, 0.0);
    const mvp = mult(pv, M_center);

    const uniformBuffer = device.createBuffer({
        size: sizeof['mat4'] + 4 * 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const uniformBufferShadow = device.createBuffer({
        size: sizeof['mat4'] + 4 * 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    // device.queue.writeBuffer(uniformBuffer, 0, flatten(mvp)) 

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
            { binding: 1, resource: textureGround.sampler },
            { binding: 2, resource: textureGround.createView() },
        ],
    });

    const bindGroupRed = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [  
            { binding: 0, resource: { buffer: uniformBuffer } },
            { binding: 1, resource: textureRed.sampler },
            { binding: 2, resource: textureRed.createView() },
        ],
    });

    const bindGroupShadow = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: uniformBufferShadow } },
            { binding: 1, resource: textureRed.sampler },
            { binding: 2, resource: textureRed.createView() },
        ],
    });

    let angle = 0;
    const radius = 2.0;

    function render() {
        angle += 0.01;
        const lightPos = vec3(
            radius * Math.cos(angle),
            2.0,
            - radius + radius * Math.sin(angle)
        );
        const e = 0.0001;
        const d = 1.0 - e;
        const n = vec3(0.0, 1.0, 0.0); // ground plane normal
        const a = d + dot(n, lightPos);
        const M_shadow = mat4(
            a - lightPos[0] * n[0],    -lightPos[0] * n[1],     -lightPos[0] * n[2],     -lightPos[0] * d,
               -lightPos[1] * n[0],  a - lightPos[1] * n[1],   -lightPos[1] * n[2],     -lightPos[1] * d,
               -lightPos[2] * n[0],    -lightPos[2] * n[1],   a - lightPos[2] * n[2],   -lightPos[2] * d,
                     -n[0],                 -n[1],                 -n[2],                a - d

        );
        const mvp_shadow = mult(pv, M_shadow);
        device.queue.writeBuffer(uniformBufferShadow, 0, flatten(mvp_shadow));
        device.queue.writeBuffer(uniformBufferShadow, sizeof['mat4'], new Float32Array([0.0])); 

        device.queue.writeBuffer(uniformBuffer, 0, flatten(mvp));
        device.queue.writeBuffer(uniformBuffer, sizeof['mat4'], new Float32Array([1.0]));





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
        // Draw ground
        pass.setBindGroup(0, bindGroup);
        pass.drawIndexed(6, 1, 0, 0, 0);
        // Draw shadowed red quads
        pass.setBindGroup(0, bindGroupShadow);
        pass.drawIndexed(6, 1, 6, 0, 0);
        pass.drawIndexed(6, 1, 12, 0, 0);
        // Draw red quads
        pass.setBindGroup(0, bindGroupRed);
        pass.drawIndexed(6, 1, 6, 0, 0);
        pass.drawIndexed(6, 1, 12, 0, 0);
        pass.end();
        device.queue.submit([encoder.finish()]);
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

}

window.onload = main;
