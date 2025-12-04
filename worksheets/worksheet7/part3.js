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



async function loadCubeTexture(device) {
    const wrapSelect = document.getElementById("wrapMode");
    const minSelect = document.getElementById("minFilter");
    const magSelect = document.getElementById("magFilter");
    const mipmapSelect = document.getElementById("mipmapFilter");
    const useMipCheckbox = document.getElementById("useMip");

    const enableMipmap = useMipCheckbox.checked;

    var cubemap = ['textures/cm_left.png', // POSITIVE_X
                    'textures/cm_right.png', // NEGATIVE_X
                    'textures/cm_top.png', // POSITIVE_Y
                    'textures/cm_bottom.png', // NEGATIVE_Y
                    'textures/cm_back.png', // POSITIVE_Z
                    'textures/cm_front.png']; // NEGATIVE_Z
    
    const img = await Promise.all(cubemap.map(async (filename) => {
        const response = await fetch(filename);
        const blob = await response.blob();
        return await createImageBitmap(blob, {colorSpaceConversion: 'none'});
    }));

    
    const mipLevelCount = 1;


    const texture = device.createTexture({
        size: [img[0].width, img[0].height, 6],
        dimension: '2d',
        format: 'rgba8unorm',
        mipLevelCount: mipLevelCount,
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    });
    for (let face = 0; face < 6; ++face) {
        device.queue.copyExternalImageToTexture(
            { source: img[face] },
            { texture: texture, origin: { x: 0, y: 0, z: face } },
            { width: img[face].width, height: img[face].height }
        );
    }


    let sampler = null;
    function updateSamplerAndBindGroup(pipeline, uniformBuffer) {
        sampler = device.createSampler({
            addressModeU: wrapSelect.value,
            addressModeV: wrapSelect.value,
            minFilter: minSelect.value,
            magFilter: magSelect.value,
            mipmapFilter: useMipCheckbox.checked ? mipmapSelect.value : 'nearest',
        });
        return device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: { buffer: uniformBuffer },
                },
                {
                    binding: 1,
                    resource: sampler,
                },
                {
                    binding: 2,
                    resource: texture.createView( { dimension: 'cube' } ),
                },
            ],
        });
    }

    return {texture, updateSamplerAndBindGroup};
}



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
    const shaderCode = await fetch('part3.wgsl').then(r => r.text());
    const shaderModule = device.createShaderModule({code: shaderCode});
    // --------------------------- set up geometry data ---------------------------

    let level = 0;
    const levelLabel = document.getElementById("levelLabel");
    document.getElementById("incSub").onclick = () => {
        level = Math.min(level + 1, 8);
        refreshGeometry();
    }
    document.getElementById("decSub").onclick = () => {
        level = Math.max(level - 1, 0);
        refreshGeometry();
    }
    let vertexBuffer, indexBuffer, indexCount;

    function refreshGeometry() {
        levelLabel.textContent = "Subdivision Level: " + level;
        const {vertices, indices} = buildSphere(level);
        indexCount = indices.length;
        
        vertexBuffer = device.createBuffer({
            size: vertices.length * sizeof['vec3'],
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(vertexBuffer, 0, flatten(vertices));

        indexBuffer = device.createBuffer({
            size: indices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(indexBuffer, 0, indices);
    
    }
    refreshGeometry();

    let quadVertexBuffer, quadIndexBuffer, quadIndexCount;

    {
        const quadVertices = [
            vec3(-1.0, -1.0, 0.999),  
            vec3( 1.0, -1.0, 0.999),  
            vec3(-1.0,  1.0, 0.999),  
            vec3( 1.0,  1.0, 0.999),  
        ];
        const quadIndices = new Uint32Array([
            0, 1, 2,
            2, 1, 3
        ]);
        quadIndexCount = quadIndices.length;

        quadVertexBuffer = device.createBuffer({
            size: quadVertices.length * sizeof['vec3'],
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(quadVertexBuffer, 0, flatten(quadVertices));

        quadIndexBuffer = device.createBuffer({
            size: quadIndices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(quadIndexBuffer, 0, quadIndices);
    }

    const vertexLayout = {
        arrayStride: sizeof['vec3'],
        attributes: [
            {
                shaderLocation: 0,
                offset: 0,
                format: 'float32x3',
            },
        ],
    };

    const pipeline = device.createRenderPipeline({
        layout: 'auto',
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
        multisample: {
            count: 4,
        },
    });

    const uniformBuffer = device.createBuffer({
        size: 3 * sizeof['mat4'],
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const quadUniformBuffer = device.createBuffer({
        size: 3 * sizeof['mat4'],
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const {texture, updateSamplerAndBindGroup} = await loadCubeTexture(device);
    let bindGroup = updateSamplerAndBindGroup(pipeline, uniformBuffer);
    let quadBindGroup = updateSamplerAndBindGroup(pipeline, quadUniformBuffer);


    document.getElementById("wrapMode").onchange = 
    document.getElementById("minFilter").onchange =
    document.getElementById("magFilter").onchange =
    document.getElementById("mipmapFilter").onchange =
    document.getElementById("useMip").onchange = () => {
        bindGroup = updateSamplerAndBindGroup(pipeline, uniformBuffer);
        quadBindGroup = updateSamplerAndBindGroup(pipeline, quadUniformBuffer);
    };

    const depthTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: 'depth24plus',
        sampleCount: 4,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    const msaaColorTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        sampleCount: 4,
        format: format,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    


    const Mst = mat4(
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 0.5, 0.5,
        0.0, 0.0, 0.0, 1.0
    );
    const projection = perspective(90, canvas.width / canvas.height, 0.1, 100);
    let angle = 0;
    const radius = 3.0;

    function updateMVP() {
        // angle += 0.01;
        const eye = vec3(radius * Math.sin(angle), 0.0, radius * Math.cos(angle));
        const view = lookAt(eye, vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0));
        const p = mult(Mst, projection);
        const pv = mult(p, view);
        const M_center = translate(0.0, 0.0, 0.0);
        const mvp = mult(pv, M_center);
        const mtex = mat4();
        device.queue.writeBuffer(uniformBuffer, 0, flatten(mvp));
        device.queue.writeBuffer(uniformBuffer, sizeof['mat4'], flatten(mtex));
        const extraSphere = new Float32Array(16);
        extraSphere[0] = eye[0];
        extraSphere[1] = eye[1];
        extraSphere[2] = eye[2];
        extraSphere[3] = 1.0;
        device.queue.writeBuffer(uniformBuffer, 2 * sizeof['mat4'], extraSphere);

        const mvpQuad = mat4();
        const invPojection = inverse(p);
        invPojection[1][1] *= -1;
        let invView = inverse(view);
        invView[0][3] = 0.0;
        invView[1][3] = 0.0;
        invView[2][3] = 0.0;
        invView[3][3] = 0.0;
        const mtexquad = mult(invView, invPojection);
        device.queue.writeBuffer(quadUniformBuffer, 0, flatten(mvpQuad));
        device.queue.writeBuffer(quadUniformBuffer, sizeof['mat4'], flatten(mtexquad));
        const extraQuad = new Float32Array(16);
        extraQuad[0] = eye[0];
        extraQuad[1] = eye[1];
        extraQuad[2] = eye[2];
        extraQuad[3] = 0.0;
        device.queue.writeBuffer(quadUniformBuffer, 2 * sizeof['mat4'], extraQuad);
    }


    function render() {
        angle += 0.01;
        updateMVP();

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
        pass.setVertexBuffer(0, quadVertexBuffer);
        pass.setIndexBuffer(quadIndexBuffer, 'uint32');
        pass.setBindGroup(0, quadBindGroup);
        pass.drawIndexed(quadIndexCount);
        pass.setVertexBuffer(0, vertexBuffer);
        pass.setIndexBuffer(indexBuffer, 'uint32');
        pass.setBindGroup(0, bindGroup);
        pass.drawIndexed(indexCount);
        pass.end();
        device.queue.submit([encoder.finish()]);
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

}

window.onload = main;
