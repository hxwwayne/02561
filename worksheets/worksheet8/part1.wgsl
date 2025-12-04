struct Uniforms {
    mvp: mat4x4<f32>,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var ourSampler: sampler;
@group(0) @binding(2) var ourTexture: texture_2d<f32>;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) fragTexCoord: vec2<f32>,
};

@vertex
fn vs_main(
    @location(0) inPos: vec4<f32>,
    @location(1) inTexCoord: vec2<f32>,
) -> VertexOutput {
    var output: VertexOutput;
    output.position = uniforms.mvp * inPos;
    output.fragTexCoord = inTexCoord;
    return output;
}

@fragment
fn fs_main(@location(0) fragTexCoord: vec2<f32>) -> @location(0) vec4<f32> {
    let texColor: vec4<f32> = textureSample(ourTexture, ourSampler, fragTexCoord);
    return texColor;
}
