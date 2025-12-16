struct Uniforms {
    mvp: mat4x4<f32>,
    eye: vec4<f32>,
    params1: vec4<f32>, // Le, La, kd, ks
    params2: vec4<f32>, // s, visibility and padding
    lightPos: vec4<f32>,
    model: mat4x4<f32>,
    lightViewProj: mat4x4<f32>,
    shadowMapRes: vec2<f32>,
    padding: vec2<f32>,
}

// struct VertexOutput {
//     @builtin(position) position: vec4<f32>,
//     @location(0) inPos: vec4<f32>,
//     @location(1) inColor: vec4<f32>,
//     @location(2) inNormal: vec4<f32>;
// };

struct VSInTeapot {
    @location(0) position : vec4<f32>,
    @location(1) color    : vec4<f32>,
    @location(2) normal   : vec4<f32>,
};

struct VSOutTeapot {
    @builtin(position) position : vec4<f32>,
    @location(0) vColor         : vec4<f32>,
    @location(1) vNormal        : vec3<f32>,
    @location(2) vWorldPos      : vec3<f32>,
    @location(3) vLightSpacePos : vec4<f32>,  // 新增
};


@group(0) @binding(0)
var<uniform> uniforms: Uniforms;

fn compute_shadow_factor(lightSpacePos : vec4<f32>) -> f32 {
    // light clip -> NDC
    let p = lightSpacePos / lightSpacePos.w;

    let depthCurrent = 0.5 * p.z + 0.5;

    var shadowCoords = vec3<f32>(
        0.5 * p.x + 0.5,
       -0.5 * p.y + 0.5,
        depthCurrent
    );

    
    if (shadowCoords.x < 0.0 || shadowCoords.x > 1.0 ||
        shadowCoords.y < 0.0 || shadowCoords.y > 1.0 ||
        shadowCoords.z < 0.0 || shadowCoords.z > 1.0) {
        return 1.0;
    }


    let texSize = uniforms.shadowMapRes;
    let texelCoords = vec2u(shadowCoords.xy * texSize);

    let depthTex = textureLoad(shadowMap, texelCoords, 0).r;
    let epsilon = 0.001;


    let inShadow = depthTex < depthCurrent - epsilon;

    return select(1.0, 0.0, inShadow);  // inShadow ? 0 : 1
}




@vertex
fn vs_main_teapot(input : VSInTeapot) -> VSOutTeapot {
    var out : VSOutTeapot;

    let worldPos = uniforms.model * input.position;
    out.position = uniforms.mvp * input.position;
    out.vColor = input.color;
    out.vNormal = normalize((uniforms.model * vec4<f32>(input.normal.xyz, 0.0)).xyz);
    out.vWorldPos = worldPos.xyz;

    out.vLightSpacePos = uniforms.lightViewProj * worldPos;
    return out;
}

@fragment
fn fs_main_teapot(input : VSOutTeapot) -> @location(0) vec4<f32> {
    var N = normalize(input.vNormal);
    if (uniforms.params2.w > 0.5) {
        N.y = -N.y;
    };
    let L = normalize(uniforms.lightPos.xyz - input.vWorldPos);
    let V = normalize(uniforms.eye.xyz - input.vWorldPos);
    let H = normalize(L + V);

    let Le  = uniforms.params1.x;
    let La  = uniforms.params1.y;
    let kd  = uniforms.params1.z;
    let ks  = uniforms.params1.w;
    let shininess = uniforms.params2.x;

    let NoL = max(dot(N, L), 0.0);
    let NoH = max(dot(N, H), 0.0);

    var shadowFactor = 1.0;
    if (uniforms.params2.w < 0.5) {
        shadowFactor = compute_shadow_factor(input.vLightSpacePos);
    }
    // let shadowFactor = 1.0;

    let diffuse  = kd * Le * NoL * shadowFactor;
    let specular = ks * Le * pow(NoH, shininess) * shadowFactor;
    let ambient  = kd * La;

    let color = input.vColor.rgb * (diffuse + ambient) + vec3<f32>(specular);
    let h = clamp((input.vWorldPos.y + 1.0) / 1.0, 0.0, 1.0);
    let reflectAlpha = 0.4 * (1.0 - h);
    return vec4<f32>(color, reflectAlpha);
}

// -----------------------------------------ground shader-----------------------------------------
@group(0) @binding(1) var textureGround: texture_2d<f32>;
@group(0) @binding(2) var samplerGround: sampler;

struct VertexOutputGround {
    @builtin(position) position: vec4<f32>,
    @location(0) fragTexCoord: vec2<f32>,
    @location(1) vLightSpacePos: vec4<f32>,
}

@vertex
fn vs_main_ground(
    @location(0) inPos: vec4<f32>,
    @location(1) inTexCoord: vec2<f32>,
) -> VertexOutputGround {
    var output: VertexOutputGround;
    output.position = uniforms.mvp * inPos;
    output.fragTexCoord = inTexCoord;
    let worldPos = uniforms.model * inPos;
    output.vLightSpacePos = uniforms.lightViewProj * worldPos;
    return output;
}

@fragment
fn fs_main_ground(input: VertexOutputGround) -> @location(0) vec4<f32> {
    let visibility = uniforms.params2.y;
    let texColor: vec4<f32> = textureSample(textureGround, samplerGround, input.fragTexCoord);

    let shadowFactor = compute_shadow_factor(input.vLightSpacePos);

    let Le  = uniforms.params1.x;
    let La  = uniforms.params1.y;
    let kd  = uniforms.params1.z;

    let ambient = kd * La;
    let direct  = kd * Le * shadowFactor;

    let lighting = ambient + direct;

    let color = texColor.rgb * lighting;
    return vec4<f32>(color, visibility);
}


@group(0) @binding(3) var shadowMap : texture_2d<f32>;
// @group(0) @binding(4) var shadowSampler : sampler;

struct VSInDepth {
    @location(0) inPos : vec4<f32>,
};
struct VSOutDepth {
    @builtin(position) position : vec4<f32>,
    @location(0) lightSpacePos  : vec4<f32>,
};

@vertex
fn vs_main_depth(input: VSInDepth) -> VSOutDepth {
    var out : VSOutDepth;

    let worldPos   = uniforms.model * input.inPos;
    let lightClip  = uniforms.lightViewProj * worldPos;

    out.position       = lightClip;      
    out.lightSpacePos  = lightClip;      

    return out;
}

struct FSInDepth {
    @location(0) lightSpacePos : vec4<f32>,
};

@fragment
fn fs_main_depth(input : FSInDepth) -> @location(0) vec4<f32> {
    let p = input.lightSpacePos / input.lightSpacePos.w;   
    let depth = 0.5 * p.z + 0.5;                           
    return vec4<f32>(depth, depth, depth, 1.0);
}
