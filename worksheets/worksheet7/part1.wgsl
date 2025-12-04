struct Uniforms {
    mvp: mat4x4<f32>,
}

const PI = 3.1415926;

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var ourSampler: sampler;
@group(0) @binding(2) var ourTexture: texture_cube<f32>;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) inPos: vec4<f32>,
};

@vertex
fn vs_main(
    @location(0) inPos: vec4<f32>,
) -> VertexOutput {
    var output: VertexOutput;
    output.position = uniforms.mvp * inPos;
    output.inPos = inPos;
    return output;
}

@fragment
fn fs_main(@location(0) inPos: vec4<f32>) -> @location(0) vec4<f32> {
    let n = normalize(inPos.xyz);
    let texColor = textureSample(ourTexture, ourSampler, n);

    return texColor;
}
