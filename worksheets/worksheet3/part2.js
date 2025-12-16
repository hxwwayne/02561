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

    // create a cube wireframe
    const vertices = [
        vec3(0.0, 0.0, 1.0),
        vec3(0.0, 1.0, 1.0),
        vec3(1.0, 1.0, 1.0),
        vec3(1.0, 0.0, 1.0),
        vec3(0.0, 0.0, 0.0),
        vec3(0.0, 1.0, 0.0),
        vec3(1.0, 1.0, 0.0),
        vec3(1.0, 0.0, 0.0),
    ];

    const wireframe_indices = new Uint32Array([
        0, 1, 1, 2, 2, 3, 3, 0, // front
        2, 3, 3, 7, 7, 6, 6, 2, // right
        0, 3, 3, 7, 7, 4, 4, 0, // down
        1, 2, 2, 6, 6, 5, 5, 1, // up
        4, 5, 5, 6, 6, 7, 7, 4, // back
        0, 1, 1, 5, 5, 4, 4, 0 // left
    ]);


    const vertexdata = flatten(vertices);
    const vertexBuffer = device.createBuffer({
        size: vertexdata.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(vertexBuffer, 0, vertexdata);

    const vertexLayout = {
        arrayStride: 3 * 4,
        attributes: [{
            shaderLocation: 0,
            offset: 0,
            format: 'float32x3',
        }],
    }

    const indexBuffer = device.createBuffer({
        size: wireframe_indices.byteLength,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(indexBuffer, 0, wireframe_indices);

    const bindGroupLayout = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            buffer: { type: 'uniform' },
        }],
    });

    const shaderCode = await fetch('part2.wgsl').then(r => r.text());
    const shaderModule = device.createShaderModule({code: shaderCode});

    const pipeline = device.createRenderPipeline({
        layout: device.createPipelineLayout({bindGroupLayouts: [bindGroupLayout]}),
        vertex: {
            module: shaderModule,
            entryPoint: 'vs_main',
            buffers: [vertexLayout],
        },
        fragment: {
            module: shaderModule,
            entryPoint: 'fs_main',
            targets: [{ format: format }],
        },
        primitive: {
            topology: 'line-list',
        },
    
    
    });

    // --------------------------- 45 degree pinhole + Mst ---------------------------
    const Mst = mat4(
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 0.5, 0.5,
        0.0, 0.0, 0.0, 1.0
    );

    const projection = perspective(45, canvas.width / canvas.height, 0.1, 100);

    const p = mult(Mst, projection);

    const eye = vec3(0.0, 0.0, 5.0);
    const at = vec3(0.0, 0.0, 0.0);
    const up = vec3(0.0, 1.0, 0.0);
    const view = lookAt(eye, at, up);

    const pv = mult(p, view);

    // --------------------------- model matrix ---------------------------

    const M_center = translate (-0.5, -0.5, -0.5);
    
    const M1 = mult(translate(-2.0, 0.0, 0.0), M_center);
    const M2 = mult(translate(0.0, 0.0, 0.0), mult(rotateY(-30), M_center));
    const M3 = mult(translate(2.0, 0.0, 0.0), mult(rotateY(20), mult(rotateX(-30), M_center)));

    const mvp1 = mult(pv, M1);
    const mvp2 = mult(pv, M2);
    const mvp3 = mult(pv, M3);

    function makeUniformBufferandBindGroup(matrix) {
        const buf = device.createBuffer({
            size: sizeof['mat4'],
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(buf, 0, flatten(matrix));
        const bindGroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [{binding: 0, resource: {buffer: buf}}]
        });
        return bindGroup;
    }

    const uniformBindGroup1 = makeUniformBufferandBindGroup(mvp1);
    const uniformBindGroup2 = makeUniformBufferandBindGroup(mvp2);
    const uniformBindGroup3 = makeUniformBufferandBindGroup(mvp3);
    // const uniformBuffer = device.createBuffer({
    //     size: sizeof['mat4'],
    //     usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    // });
    // device.queue.writeBuffer(uniformBuffer, 0, flatten(mvp));
    
    


    function render() {
        const encoder = device.createCommandEncoder();
        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                view: context.getCurrentTexture().createView(),
                loadOp: 'clear',
                storeOp: 'store',
                clearValue: { r: 0.4, g: 0.6, b: 0.9, a: 1.0 },
            }],
        });

        pass.setPipeline(pipeline);
        pass.setVertexBuffer(0, vertexBuffer);
        pass.setIndexBuffer(indexBuffer, 'uint32');

        pass.setBindGroup(0, uniformBindGroup1);
        pass.drawIndexed(wireframe_indices.length);

        pass.setBindGroup(0, uniformBindGroup2);
        pass.drawIndexed(wireframe_indices.length);

        pass.setBindGroup(0, uniformBindGroup3);
        pass.drawIndexed(wireframe_indices.length);
        pass.end();
        device.queue.submit([encoder.finish()]);
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

window.onload = main;
