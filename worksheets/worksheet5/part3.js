
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

    // --------------------------- set up geometry data ---------------------------

    const obj_filename = 'suzanne.obj';
    const obj = await readOBJFile(obj_filename, 1.0, true);

    let isOrbiting = true;
    const orbitBtn = document.getElementById('orbitBtn');
    if (orbitBtn) {
    orbitBtn.addEventListener('click', () => {
        isOrbiting = !isOrbiting;
        orbitBtn.textContent = `orbit: ${isOrbiting ? 'on' : 'off'}`;
        orbitBtn.setAttribute('aria-pressed', String(isOrbiting));
    });
    }


    const vertices = obj.vertices;
    const indices = obj.indices;
    const colors = obj.colors;
    const normals = obj.normals;

    const vertexBuffer = device.createBuffer({
        size: sizeof['vec4'] * vertices.length,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    const vertexLayout = {
        arrayStride: sizeof['vec4'],
        attributes: [{
            shaderLocation: 0,
            offset: 0,
            format: 'float32x4',
        }],
    }
    device.queue.writeBuffer(vertexBuffer, 0, flatten(vertices));

    const indexBuffer = device.createBuffer({
        size: sizeof['vec4'] * indices.length,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(indexBuffer, 0, new Uint32Array(indices));

    const colorBuffer = device.createBuffer({
        size: sizeof['vec4'] * colors.length,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    const colorLayout = {
        arrayStride: sizeof['vec4'],
        attributes: [{
            shaderLocation: 1,
            offset: 0,
            format: 'float32x4',
        }],
    }
    device.queue.writeBuffer(colorBuffer, 0, flatten(colors));

    const normalBuffer = device.createBuffer({
        size: sizeof['vec4'] * normals.length,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    const normalLayout = {
        arrayStride: sizeof['vec4'],
        attributes: [{
            shaderLocation: 2,
            offset: 0,  
            format: 'float32x4',
        }],
    }
    device.queue.writeBuffer(normalBuffer, 0, flatten(normals));
    


    const bindGroupLayout = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
            buffer: { type: 'uniform' },
        }],
    });

    const shaderCode = await fetch('part3.wgsl').then(r => r.text());
    const shaderModule = device.createShaderModule({code: shaderCode});

    const msaaCount = 4;
    const depthTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
        sampleCount: msaaCount,
    });
    const msaaTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: format,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
        sampleCount: msaaCount,
    });


    const pipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: {
            module: shaderModule,
            entryPoint: 'vs_main',
            buffers: [vertexLayout, colorLayout, normalLayout],
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
        multisample: { count: msaaCount},
    
    });

    const params = {
        Le: 1.0, La: 0.15, kd: 0.9, ks: 0.6, s: 64.0,
    };
    ['Le','La','kd','ks','s'].forEach(k=>{
    const el = document.getElementById(k);
    if (el) {
        el.addEventListener('input', e => { params[k] = parseFloat(e.target.value); updateMVP(); });
    }
    });

    // --------------------------- 45 degree pinhole + Mst ---------------------------
    const Mst = mat4(
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 0.5, 0.5,
        0.0, 0.0, 0.0, 1.0
    );

    const UNIFORM_SIZE = 16 + 4 + 4 + 4; // mvp(16) + eye(4) + params1(4) + params2(4)
    function makeUniformBufferandBindGroup(matrix) {
        const buf = device.createBuffer({
            size: UNIFORM_SIZE * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(buf, 0, matrix);
        const bindGroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [{binding: 0, resource: {buffer: buf}}]
        });
        return bindGroup;
    }


    const fovy = 45.0;
    const near = 0.05;
    const far = 100.0;
    let angle = 0.0;
    const radius = 5.0;
    const at = vec3(0.0, 0.0, 0.0);
    const up = vec3(0.0, 1.0, 0.0);
    const projection = perspective(fovy, canvas.width / canvas.height, near, far);

    function updateMVP() {
        const eye = vec3(radius*Math.sin(angle), 0.0, radius*Math.cos(angle));

        const view = lookAt(eye, at, up);
        const pv = mult(projection, view);

        const M_center = translate (0.0, 0.0, 0.0);
        const mvp = mult(Mst ,mult(pv, M_center));

        const data = new Float32Array(UNIFORM_SIZE);
        data.set(flatten(mvp), 0);
        data.set(vec4(eye, 1.0), 16);
        data.set([params.Le, params.La, params.kd, params.ks], 20);
        data.set([params.s, 0, 0, 0], 24);


        uniformBindGroup = makeUniformBufferandBindGroup(data); 
    }    


    function render() {
        if (isOrbiting)
            angle += 0.01;
        updateMVP();
        const encoder = device.createCommandEncoder();
        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                view: msaaTexture.createView(),
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
        pass.setVertexBuffer(1, colorBuffer);
        pass.setVertexBuffer(2, normalBuffer);
        pass.setIndexBuffer(indexBuffer, 'uint32');

        pass.setBindGroup(0, uniformBindGroup);
        pass.drawIndexed(indices.length);

        pass.end();
        device.queue.submit([encoder.finish()]);
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

window.onload = main;
