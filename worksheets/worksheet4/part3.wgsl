struct Uniforms {
    mvp: mat4x4<f32>
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec4<f32>,
};


@group(0) @binding(0)
var<uniform> uniforms: Uniforms;


@vertex
fn vs_main(@location(0) inPos: vec4f) -> VertexOutput {
    var output: VertexOutput;
    let n = normalize(inPos.xyz);
    let wi = vec3<f32>(0.0, 0.0, 1.0);
    let kd = 1.0;
    let le = vec3<f32>(1.0, 1.0, 1.0);
    let ndotl = max(dot(n, wi), 0.0);
    let ld = kd * le * ndotl;
    output.position = uniforms.mvp * inPos;
    output.color = vec4<f32>(ld, 1.0);
    // output.color = 0.5 * inPos + 0.5;
    return output;
}

@fragment
fn fs_main(@location(0) inColor: vec4<f32>) -> @location(0) vec4<f32> {
  
    return inColor;
}


