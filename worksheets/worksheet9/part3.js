function shadowMatrixForPlane(lightPos) {
    const Lx = lightPos[0], Ly = lightPos[1], Lz = lightPos[2];
    const n = vec3(0.0, 1.0, 0.0);
    const e = 0.0001;  
    const d = 1.0 + e;                  
    const a = d + dot(n, lightPos); 

    return mat4(
        a - Lx * n[0],   -Lx * n[1],      -Lx * n[2],      -Lx * d,
        -Ly * n[0],      a - Ly * n[1],   -Ly * n[2],      -Ly * d,
        -Lz * n[0],      -Lz * n[1],      a - Lz * n[2],   -Lz * d,
        -n[0],           -n[1],           -n[2],           a - d
    );
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

    const obj_filename = 'teapot.obj';
    const obj = await readOBJFile(obj_filename, 1.0, true);

    const lightBtn = document.getElementById('lightBtn');
    if (lightBtn) {
        lightBtn.addEventListener('click', () => {
            animateLight = !animateLight;
            lightBtn.textContent = `light: ${animateLight ? 'on' : 'off'}`;
            lightBtn.setAttribute('aria-pressed', String(animateLight));
        });
    }

    const vertices = obj.vertices;
    const indices = obj.indices;
    const colors = obj.colors;
    const normals = obj.normals;

    const vertexBufferTeapot = device.createBuffer({
        size: sizeof['vec4'] * vertices.length,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    const vertexTeapotLayout = {
        arrayStride: sizeof['vec4'],
        attributes: [{
            shaderLocation: 0,
            offset: 0,
            format: 'float32x4',
        }],
    }
    device.queue.writeBuffer(vertexBufferTeapot, 0, flatten(vertices));

    const indexBufferTeapot = device.createBuffer({
        size: sizeof['vec4'] * indices.length,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(indexBufferTeapot, 0, new Uint32Array(indices));
    const colorBufferTeapot = device.createBuffer({
        size: sizeof['vec4'] * colors.length,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    const colorTeapotLayout = {
        arrayStride: sizeof['vec4'],
        attributes: [{
            shaderLocation: 1,
            offset: 0,
            format: 'float32x4',
        }],
    }
    device.queue.writeBuffer(colorBufferTeapot, 0, flatten(colors));

    const normalBufferTeapot = device.createBuffer({
        size: sizeof['vec4'] * normals.length,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    const normalTeapotLayout = {
        arrayStride: sizeof['vec4'],
        attributes: [{
            shaderLocation: 2,
            offset: 0,  
            format: 'float32x4',
        }],
    }
    device.queue.writeBuffer(normalBufferTeapot, 0, flatten(normals));

    // --------------------------- ground plane ---------------------------
     const groundVertices = [
        vec3(-2.0, -1.0, -1.0),
        vec3( 2.0, -1.0, -1.0),
        vec3( 2.0, -1.0, -5.0),
        vec3(-2.0, -1.0, -5.0),
    ];
    const groundIndices = new Uint32Array([0, 1, 2, 0, 2, 3]);
    const groundTexcoords = [
        vec2(0.0, 0.0),
        vec2(1.0, 0.0),
        vec2(1.0, 1.0),
        vec2(0.0, 1.0),
    ];

    const vertexBufferGround = device.createBuffer({
        size: sizeof['vec3'] * groundVertices.length,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    const vertexGroundLayout = {
        arrayStride: sizeof['vec3'],
        attributes: [{
            shaderLocation: 0,
            offset: 0,
            format: 'float32x3',
        }],
    }
    device.queue.writeBuffer(vertexBufferGround, 0, flatten(groundVertices));

    const indexBufferGround = device.createBuffer({
        size: sizeof['vec3'] * groundIndices.length,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(indexBufferGround, 0, groundIndices);
    const textureBufferGround = device.createBuffer({
        size: sizeof['vec2'] * groundTexcoords.length,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(textureBufferGround, 0, flatten(groundTexcoords));

    const filename = 'xamp23.png';
    const response = await fetch(filename);
    const blob = await response.blob();
    const img = await createImageBitmap(blob);

    const textureGround = device.createTexture({
        size: [img.width, img.height, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    });
    const textureGroundLayout = {
        arrayStride: sizeof['vec2'],
        attributes: [{
            shaderLocation: 1,  
            offset: 0,
            format: 'float32x2',
        }],
    };
    device.queue.copyExternalImageToTexture(
        { source: img },
        { texture: textureGround },
        [img.width, img.height]
    );
    const samplerGround = device.createSampler({
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
        magFilter: 'linear',
        minFilter: 'linear',
    });

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

    // shadow maps resource
    const shadowMapSize = 1024;
    const shadowMapTexture = device.createTexture({
        size: [shadowMapSize, shadowMapSize, 1],
        format: 'rgba32float',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    });

    const shadowDepthTexture = device.createTexture({
        size: [shadowMapSize, shadowMapSize, 1],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    const shadowMapSampler = device.createSampler({
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
        magFilter: 'linear',
        minFilter: 'linear',
    });

    // --------------------------- pipelines ---------------------------

    const teapotPipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: {
            module: shaderModule,
            entryPoint: 'vs_main_teapot',
            buffers: [vertexTeapotLayout, colorTeapotLayout, normalTeapotLayout],
        },
        fragment: {
            module: shaderModule,
            entryPoint: 'fs_main_teapot',
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

    const groundPipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: {
            module: shaderModule,
            entryPoint: 'vs_main_ground',
            buffers: [vertexGroundLayout, textureGroundLayout],
        },
        fragment: {
            module: shaderModule,
            entryPoint: 'fs_main_ground',
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

    // const shadowPipeline = device.createRenderPipeline({
    //     layout: 'auto',
    //     vertex: {
    //         module: shaderModule,
    //         entryPoint: 'vs_main_ground',
    //         buffers: [vertexTeapotLayout, textureGroundLayout],
    //     },
    //     fragment: {
    //         module: shaderModule,
    //         entryPoint: 'fs_main_ground',
    //         targets: [{ format: format }],
    //     },
    //     primitive: {
    //         topology: 'triangle-list',
    //         cullMode: 'none',
    //         frontFace: 'ccw',
    //     },
    //     depthStencil: {
    //         format: 'depth24plus',
    //         depthWriteEnabled: false,
    //         depthCompare: 'greater',
    //     },
    //     multisample: { count: msaaCount},
    // });

    const depthPipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: {
            module: shaderModule,
            entryPoint: 'vs_main_depth',
            buffers: [vertexTeapotLayout],
        },
        fragment: {
            module: shaderModule,
            entryPoint: 'fs_main_depth',
            targets: [{ format: 'rgba32float' }],
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

    const UNIFORM_SIZE = 16 + 4 + 4 + 4 + 4 + 16 + 16 + 4; // mvp(16) + eye(4) + params1(4) + params2(4) +lightPos(4) + model(16) + lightMVP(16) + shadowmapres(2) + padding(2)
    function makeUniformBufferandBindGroup(matrix) {
        const buf = device.createBuffer({
            size: UNIFORM_SIZE * 4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(buf, 0, matrix);
        const bindGroup = device.createBindGroup({
            layout: teapotPipeline.getBindGroupLayout(0),
            entries: [
                {binding: 0, resource: {buffer: buf}},
                {binding: 3, resource: shadowMapTexture.createView()}
            ]
        });
        return bindGroup;
    }

    const groundUniformBuffer = device.createBuffer({
        size: UNIFORM_SIZE * 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const groundBindGroup = device.createBindGroup({
        layout: groundPipeline.getBindGroupLayout(0),
        entries: [{binding: 0, resource: {buffer: groundUniformBuffer}},
        {binding: 1, resource: textureGround.createView()},
        {binding: 2, resource: samplerGround},
        {binding: 3, resource: shadowMapTexture.createView()},
        ],
    });

    const depthUniformBuffer = device.createBuffer({
        size: UNIFORM_SIZE * 4,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const depthBindGroup = device.createBindGroup({
        layout: depthPipeline.getBindGroupLayout(0),
        entries: [{ binding: 0, resource: { buffer: depthUniformBuffer } }],
    });

    
    // const shadowUniformBuffer = device.createBuffer({
    //     size: UNIFORM_SIZE * 4,
    //     usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    // });
    // const shadowBindGroup = device.createBindGroup({
    //     layout: shadowPipeline.getBindGroupLayout(0),
    //     entries: [{binding: 0, resource: {buffer: shadowUniformBuffer}},
    //         { binding: 1, resource: textureGround.createView()},
    //         { binding: 2, resource: samplerGround }
    //     ]
    // });


    const fovy = 60;
    const near = 0.05;
    const far = 100.0;
    let angle = 0.0;
    const radius = 2;
    const at = vec3(0.0, 0.0, 0.0);
    const up = vec3(0.0, 1.0, 0.0);
    const projection = perspective(fovy, canvas.width / canvas.height, near, far);

    let isJumping = true;
    let jumpPhase = 0.0;
    const jumpBtn = document.getElementById('jumpBtn');
    if (jumpBtn) {
    jumpBtn.addEventListener('click', () => {
        isJumping = !isJumping;
        jumpBtn.textContent = `jump: ${isJumping ? 'on' : 'off'}`;
        jumpBtn.setAttribute('aria-pressed', String(isJumping));
    });
    }

    let uniformBindGroup = null;

    function updateMVP() {
        const eye = vec3(radius*Math.sin(angle), 0.0, radius*Math.cos(angle));

        const view = mat4();
        const pv = mult(projection, view);
        let yTranslate = -1.0;
        if (isJumping) {
            const centerY = (-1.0 + 0.5) * 0.5;
            const ampY = (0.5 - (-1.0)) * 0.5;
            yTranslate = centerY + ampY * Math.sin(jumpPhase);
        }
        const M_scale = scalem(0.25, 0.25, 0.25);
        const M_trans = translate(0.0, yTranslate, -3.0);
        const M_model = mult(M_trans, M_scale);
        const M_center = translate (0.0, 0.0, 0.0);
        const mvpteapot = mult(Mst ,mult(pv, M_model));

        const lightPos = vec3(
            lightCenter[0] + lightRadius * Math.cos(lightAngle),
            lightCenter[1],
            lightCenter[2] + lightRadius * Math.sin(lightAngle)
        );
        // light view and projection
        lightView = lookAt(lightPos, vec3(0.0, -1.0, -3.0), vec3(0.0, 1.0, 0.0));
        const lightPV = mult(lightProjection, lightView);
        const M_shadow = shadowMatrixForPlane(lightPos);
        // const mvpShadow = mult(Mst ,mult(pv, mult(M_shadow, M_model)));

        const data = new Float32Array(UNIFORM_SIZE);
        data.set(flatten(mvpteapot), 0);
        data.set(vec4(eye, 1.0), 16);
        data.set([params.Le, params.La, params.kd, params.ks], 20);
        data.set([params.s, 1.0, 0, 0], 24);
        data.set(vec4(lightPos, 1.0), 28);
        data.set(flatten(M_model), 32);
        data.set(flatten(lightPV), 48);              // 48 = 32 + 16
        data.set([shadowMapSize, shadowMapSize, 0.0, 0.0], 64);


        uniformBindGroup = makeUniformBufferandBindGroup(data); 
        const M_ground = mat4();
        const mvpground = mult(Mst ,mult(pv, M_ground));
        const groundData = new Float32Array(UNIFORM_SIZE);
        groundData.set(flatten(mvpground), 0);
        groundData.set(vec4(eye, 1.0), 16);
        groundData.set([params.Le, params.La, params.kd, params.ks], 20);
        groundData.set([params.s, 1.0, 0, 0], 24);
        groundData.set(vec4(lightPos, 1.0), 28);
        groundData.set(flatten(M_ground), 32);
        groundData.set(flatten(lightPV), 48);
        groundData.set([shadowMapSize, shadowMapSize, 0.0, 0.0], 64);
        device.queue.writeBuffer(groundUniformBuffer, 0, groundData);
        // const shadowData = new Float32Array(UNIFORM_SIZE);
        // shadowData.set(flatten(mvpShadow), 0);
        // device.queue.writeBuffer(shadowUniformBuffer, 0, shadowData);
        const depthData = new Float32Array(UNIFORM_SIZE);
        depthData.set(flatten(M_model), 32);
        depthData.set(flatten(lightPV), 48);
        device.queue.writeBuffer(depthUniformBuffer, 0, depthData);
    }    

    let lightAngle = 0.0;
    let animateLight = true;
    const lightRadius = 2.0;
    const lightCenter = vec3(0.0, 2.0, -2.0);
    lightFovy = 60.0;
    lightNear = 0.1;
    lightFar = 20.0;
    lightProjection = perspective(lightFovy, 1.0, lightNear, lightFar);

    function render() {
        if (isJumping) jumpPhase += 0.1;
        if (animateLight) lightAngle += 0.01;
        updateMVP();

        const encoder = device.createCommandEncoder();

        // ----- 1) shadow map pass -----
        {
            const shadowPass = encoder.beginRenderPass({
                colorAttachments: [{
                    view: shadowMapTexture.createView(),
                    loadOp: 'clear',
                    storeOp: 'store',
                    clearValue: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 }, // 远平面
                }],
                depthStencilAttachment: {
                    view: shadowDepthTexture.createView(),
                    depthLoadOp: 'clear',
                    depthStoreOp: 'store',
                    depthClearValue: 1.0,
                },
            });

            shadowPass.setPipeline(depthPipeline);
            shadowPass.setBindGroup(0, depthBindGroup);
            shadowPass.setVertexBuffer(0, vertexBufferTeapot);
            shadowPass.setIndexBuffer(indexBufferTeapot, 'uint32');
            shadowPass.drawIndexed(indices.length);

            //（可选）也可以在这里画 ground 做 self-shadow

            shadowPass.end();
        }

        // ----- 2) normal camera pass -----
        {
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

            // 画地面（使用 shadow map）
            pass.setPipeline(groundPipeline);
            pass.setVertexBuffer(0, vertexBufferGround);
            pass.setVertexBuffer(1, textureBufferGround);
            pass.setIndexBuffer(indexBufferGround, 'uint32');
            pass.setBindGroup(0, groundBindGroup);
            pass.drawIndexed(groundIndices.length);

            // 画 teapot（使用 shadow map）
            pass.setPipeline(teapotPipeline);
            pass.setVertexBuffer(0, vertexBufferTeapot);
            pass.setVertexBuffer(1, colorBufferTeapot);
            pass.setVertexBuffer(2, normalBufferTeapot);
            pass.setIndexBuffer(indexBufferTeapot, 'uint32');
            pass.setBindGroup(0, uniformBindGroup);
            pass.drawIndexed(indices.length);

            pass.end();
        }

        device.queue.submit([encoder.finish()]);
        requestAnimationFrame(render);
    }


    requestAnimationFrame(render);
}

window.onload = main;
