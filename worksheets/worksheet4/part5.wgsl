struct Uniforms {
    mvp: mat4x4<f32>,
    eye: vec3<f32>,
    params1: vec4<f32>, // Le, La, kd, ks
    params2: vec4<f32> // s and padding
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) inPos: vec4<f32>,
};


@group(0) @binding(0)
var<uniform> uniforms: Uniforms;


@vertex
fn vs_main(@location(0) inPos: vec4f) -> VertexOutput {
    var output: VertexOutput;
    output.position = uniforms.mvp * inPos;
    output.inPos = inPos;

    return output;
}

@fragment
fn fs_main(@location(0) inPos: vec4<f32>) -> @location(0) vec4<f32> {
  
    let n = normalize(inPos.xyz);
    let wi = vec3<f32>(0.0, 0.0, 1.0); 

    let L_e = vec3<f32>(uniforms.params1.x);
    let L_a = vec3<f32>(uniforms.params1.y);
    let k_d = uniforms.params1.z * vec3<f32>(1.0, 0.4, 0.0);
    let k_s = vec3<f32>(uniforms.params1.w);
    let s = uniforms.params2.x;
    let L_i = L_e;

    let w_o = normalize(uniforms.eye - inPos.xyz);
    let w_r = 2.0 * dot(n, wi) * n - wi;
    let L_rs = k_s * L_i * pow(max(dot(w_r, w_o), 0.0), s);
    let L_rs_clamped = select(vec3<f32>(0.0, 0.0, 0.0), L_rs, dot(n, wi) > 0.0);
    let L_rd = k_d * L_i * max(dot(n, wi), 0.0);
    let L_ra = k_d * L_a;
    let L_o = L_rd + L_rs_clamped + L_ra; 
    return vec4<f32>(L_o, 1.0);
}


