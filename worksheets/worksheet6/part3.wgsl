struct Uniforms {
    mvp: mat4x4<f32>,
}

const PI = 3.1415926;

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var ourSampler: sampler;
@group(0) @binding(2) var ourTexture: texture_2d<f32>;

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
    let u = 0.5 + atan2(inPos.z, inPos.x) / (2.0 * PI);
    let v = 0.5 - asin(inPos.y) / PI;
    let texColor: vec4<f32> = textureSample(ourTexture, ourSampler, vec2<f32>(u, v));
    let kd = texColor.rgb;
    let ka = 0.25;
    let ambient = ka * kd;
    let L_d = normalize(vec3<f32>(0.0, 1.0, 1.0));

    let n = normalize(inPos.xyz);
    let ndotl = max(dot(n, L_d), 0.0);
    let diffuse = kd * ndotl;

    return vec4<f32>(diffuse + ambient, 1.0);
}
