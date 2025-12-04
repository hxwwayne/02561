# Part 3 – Affine and Viewing Transformations (Theory Reflection)

## 1️⃣ Transformation Matrices Used

We used standard **affine** and **viewing** transformations to position and project the cube(s) in 3D space.

### ▪ Model Transformations
| Transformation | Function | Description |
|:--|:--|:--|
| Translation | `T(tx, ty, tz)` | Moves the cube in world space |
| Rotation (X/Y/Z) | `Rx(θx)`, `Ry(θy)`, `Rz(θz)` | Rotates the cube about the respective axis |
| Scaling | `S(sx, sy, sz)` | Uniform or non-uniform scaling |
| Centering | `M_center = T(-0.5, -0.5, -0.5)` | Moves the unit cube [0,1]³ to [-0.5, 0.5]³ (center at origin) |

### ▪ View Transformations
| Type | Function | Description |
|:--|:--|:--|
| **Isometric View** | `V_iso = Rx(35.264°) · Ry(45°)` | Rotates world so x, y, z axes are 120° apart on screen |
| **Camera View** | `V_cam = lookAt(eye, at, up)` | Defines pinhole camera position and orientation |

### ▪ Projection Transformations
| Type | Function | Description |
|:--|:--|:--|
| Orthographic | `P_ortho = ortho(l, r, b, t, n, f)` | Projects without perspective distortion |
| Perspective | `P_persp = perspective(fovy = 45°, aspect, n, f)` | Pinhole camera with 45° vertical field of view |

### ▪ Depth Correction for WebGPU
| Matrix | Expression | Purpose |
|:--|:--|:--|
| **`Mst`** | ```mat4(1, 0, 0, 0,  0, 1, 0, 0,  0, 0, 0.5, 0.5,  0, 0, 0, 1)``` | Maps OpenGL z∈[-1, 1] → WebGPU z∈[0, 1] |

---

## 2️⃣ Composite Matrix Formulation

### General form:
$$
\begin{equation}
C = Mst · P · V · M_{model}
\end{equation}
$$

### For Part I:
$$
\begin{equation}
C = Mst · P_{ortho} · V_{iso} · M_{model}
\end{equation}
$$
where:
- `P_ortho = ortho(l, r, b, t, n, f)`  
- `V_iso = Rx(35.264°) · Ry(45°)`  
- `M_center = T(-0.5, -0.5, -0.5)`


### For Part II:
$$
\begin{align}
P_{common} & = Mst · P_{persp} \\
V_{cam} & = lookAt(eye, at, up) \\
PV & =  P_{common} · V_{cam} \\
\end{align}
$$

#### One-Point Perspective:
$$
\begin{align}
M_1 = & T(x_{left}, 0 , 0) · M_{center} \\
C_1 = & PV · M_1 \\
\end{align}
$$

#### Two-Point Perspective:
$$
\begin{align}
M_2 = & T(x_{mid}, 0 , 0) · Ry(\alpha) · M_{center} \\
C_2 = & PV · M_2 \\
\alpha \approx & \pm 30° \\
\end{align}
$$

#### Three-Point Perspective:
$$
\begin{align}
M_3 = & T(x_{right}, 0 , 0) · Rx(\beta) · Ry(\alpha) · M_{center} \\
C_3 = & PV · M_3 \\
\beta \approx &  20° \\
\end{align}
$$
