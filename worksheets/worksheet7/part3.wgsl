struct Uniforms {
    mvp: mat4x4<f32>,
    mtex: mat4x4<f32>,
    extra: mat4x4<f32>, // extra[0].xyz = eye, extra[0].w = reflective flag
}

const PI = 3.1415926;

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var ourSampler: sampler;
@group(0) @binding(2) var ourTexture: texture_cube<f32>;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) texDir: vec4<f32>,
    @location(1) worldPos: vec4<f32>,
};

@vertex
fn vs_main(
    @location(0) inPos: vec4<f32>,
) -> VertexOutput {
    var output: VertexOutput;
    output.position = uniforms.mvp * inPos;
    output.texDir = uniforms.mtex * inPos;
    let packed = uniforms.extra[0];
    let reflective = packed.w;

    if reflective > 0.5 {
        // for sphere
        output.worldPos = inPos;
    } else {
        // for quad
        output.worldPos = vec4<f32>(0.0, 0.0, 0.0, 1.0);
    }
    return output;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    let packed = uniforms.extra[0];
    let eye = packed.xyz;
    let reflective = packed.w;
    var dir = normalize(in.texDir.xyz);
    if reflective > 0.5 {
        // for sphere
        let normal = normalize(in.worldPos.xyz);
        let viewVec = normalize(eye - in.worldPos.xyz);
        let incident = -viewVec;
        dir = normalize(reflect(incident, normal));
    }
    let texColor = textureSample(ourTexture, ourSampler, dir);

    return texColor;
}
