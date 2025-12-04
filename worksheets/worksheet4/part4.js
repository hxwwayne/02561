function makeTetra() {
    const M_SQRT2 = Math.sqrt(2.0);
    const M_SQRT6 = Math.sqrt(6.0);
    var vertices = [
        vec3(0.0, 0.0, 1.0),
        vec3(0.0, 2.0*M_SQRT2/3.0, -1.0/3.0),
        vec3(-M_SQRT6/3.0, -M_SQRT2/3.0, -1.0/3.0),
        vec3(M_SQRT6/3.0, -M_SQRT2/3.0, -1.0/3.0),
    ];
    var indices = new Uint32Array([
        0, 1, 2,
        0, 3, 1,
        1, 3, 2,
        0, 2, 3
    ]);
    return {vertices, indices};
}

function edgeKey(a,b){ return a<b ? `${a}|${b}` : `${b}|${a}`; }

function normalize3(v) {
    const len = Math.hypot(v[0], v[1], v[2]) || 1.0;
    return vec3(v[0]/len, v[1]/len, v[2]/len);
}

function subdivison(vertecies, indices) {
    const newVertices = vertecies.slice();
    const midCache = new Map();
    const tris = [];

    function midIndex(i0, i1) {
        const key = edgeKey(i0, i1);
        if (midCache.has(key)) {
            return midCache.get(key);
        }

        const m = normalize3([
            0.5*(vertecies[i0][0]+vertecies[i1][0]),
            0.5*(vertecies[i0][1]+vertecies[i1][1]),
            0.5*(vertecies[i0][2]+vertecies[i1][2]),
        ]); 
        
        const idx = newVertices.push(m) - 1;
        midCache.set(key, idx);
        return idx;
    }

    for (let t = 0; t < indices.length; t += 3) {
        const i0 = indices[t];
        const i1 = indices[t+1];
        const i2 = indices[t+2];
        const m01 = midIndex(i0, i1);
        const m12 = midIndex(i1, i2);
        const m20 = midIndex(i2, i0);
        tris.push(i0, m01, m20);
        tris.push(i1, m12, m01);
        tris.push(i2, m20, m12);
        tris.push(m01, m12, m20);
    }

    return {vertices: newVertices, indices: new Uint32Array(tris)};
}


function buildSphere(level) {
    let {vertices, indices} = makeTetra();
    for (let i = 0; i < level; ++i) {
        ({vertices, indices} = subdivison(vertices, indices));
    }
    return {vertices, indices};
}



async function main() {
    // if (!navigator.gpu) {
    //     console.log("WebGPU is not supported. Make sure you are on a compatible browser.");
    //     return;
    // }
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
    // const M_SQRT2 = Math.sqrt(2.0);
    // const M_SQRT6 = Math.sqrt(6.0);
    // var vertices = [
    //     vec3(0.0, 0.0, 1.0),
    //     vec3(0.0, 2.0*M_SQRT2/3.0, -1.0/3.0),
    //     vec3(-M_SQRT6/3.0, -M_SQRT2/3.0, -1.0/3.0),
    //     vec3(M_SQRT6/3.0, -M_SQRT2/3.0, -1.0/3.0),
    // ];
    // var indices = new Uint32Array([
    //     0, 1, 2,
    //     0, 3, 1,
    //     1, 3, 2,
    //     0, 2, 3
    // ]);

    let level = 0;
    const levelLabel = document.getElementById('levelLabel');
    document.getElementById('incSub').onclick = ()=>{ level=Math.min(level+1, 8); refreshGeometry(); };
    document.getElementById('decSub').onclick = ()=>{ level=Math.max(level-1, 0); refreshGeometry(); };

    let vertexBuffer = null, indexBuffer = null, indexCount = 0;

    function refreshGeometry() {
        levelLabel.textContent = `Subdivision Level: ${level}`;
        const {vertices, indices} = buildSphere(level);

        const vertexdata = flatten(vertices);
        if (!vertexBuffer || vertexBuffer.size < vertexdata.byteLength) {
            vertexBuffer = device.createBuffer({
                size: vertexdata.byteLength,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            });
        }
        device.queue.writeBuffer(vertexBuffer, 0, vertexdata);

        if (!indexBuffer || indexBuffer.size < indices.byteLength) {
            indexBuffer = device.createBuffer({
                size: indices.byteLength,
                usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
            });
        }
        device.queue.writeBuffer(indexBuffer, 0, indices);
        indexCount = indices.length;
        console.log('indexCount =', indexCount);
    }

    refreshGeometry();

    const vertexLayout = {
        arrayStride: 3 * 4,
        attributes: [{
            shaderLocation: 0,
            offset: 0,
            format: 'float32x3',
        }],
    }

    const bindGroupLayout = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            buffer: { type: 'uniform' },
        }],
    });

    const shaderCode = await fetch('part4.wgsl').then(r => r.text());
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

    // const uniformBindGroup1 = makeUniformBufferandBindGroup(mvp1);

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
        // Create a render pass in a command buffer and submit it
        // angle += 0.01;
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

        // Insert render pass commands here
        pass.setPipeline(pipeline);
        pass.setVertexBuffer(0, vertexBuffer);
        pass.setIndexBuffer(indexBuffer, 'uint32');

        pass.setBindGroup(0, uniformBindGroup);
        pass.drawIndexed(indexCount);

        pass.end();
        device.queue.submit([encoder.finish()]);
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

window.onload = main;
