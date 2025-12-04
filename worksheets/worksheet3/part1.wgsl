struct Uniforms {
    mvp: mat4x4<f32>,
}

@group(0) @binding(0)
var<uniform> uniforms: Uniforms;


@vertex
fn vs_main(@location(0) inPos: vec4f) -> @builtin(position) vec4f {
    return uniforms.mvp * inPos;
}

@fragment
fn fs_main() -> @location(0) vec4<f32> {
  // black color
  return vec4<f32>(0.0, 0.0, 0.0, 1.0);
}
