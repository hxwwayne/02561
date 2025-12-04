struct Uniforms {
    mvp: mat4x4<f32>,
    mtex: mat4x4<f32>,
    extra: mat4x4<f32>, // extra[0].xyz = eye, extra[0].w = reflective flag
}

const PI = 3.1415926;

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var ourSampler: sampler;
@group(0) @binding(2) var ourTexture: texture_cube<f32>;
@group(0) @binding(3) var ourTexture2D: texture_2d<f32>;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) texDir: vec4<f32>,
    @location(1) worldPos: vec4<f32>,
};


fn rotate_to_normal(n: vec3f, v: vec3f) -> vec3f {
    let sgn_nz = sign(n.z + 1.0e-16);
    let a = -1.0 / (1.0 + abs(n.z));
    let b = n.x * n.y * a;
    return vec3f(1.0 + n.x * n.x * a, b, - sgn_nz * n.x) * v.x + vec3f(sgn_nz * b, sgn_nz * (1.0 + n.y * n.y * a), - n.y) * v.y + n * v.z;
}

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
        let n_world = normalize(in.worldPos.xyz);
        let u = 0.5 + atan2(n_world.z, n_world.x) / (2.0 * PI);
        let v = 0.5 - asin(n_world.y) / PI;
        let uv = vec2f(u, v);
        let texN = textureSample(ourTexture2D, ourSampler, uv).xyz;
        let n_tangent = normalize(texN * 2.0 - vec3f(1.0, 1.0, 1.0));
        let n_bumped = normalize(rotate_to_normal(n_world, n_tangent));
        let viewVec = normalize(eye - in.worldPos.xyz);
        let incident = -viewVec;
        dir = reflect(incident, n_bumped);
    } 
    let texColor = textureSample(ourTexture, ourSampler, dir);
    
    return texColor;
}
