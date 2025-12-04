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
    output.position = uniforms.mvp * inPos;
    output.color = 0.5 * inPos + 0.5;
    return output;
}

@fragment
fn fs_main(@location(0) inColor: vec4<f32>) -> @location(0) vec4<f32> {
  
    return inColor;
}
