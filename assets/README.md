# CoastOps 3D car asset

The camera guide expects the optimized GLB at:

```text
assets/coastops-car.glb
```

Validated source artifact:

- cleaned from the selected 320i Blender asset for the CoastOps demo
- GLB size: 4.85 MiB
- SHA-256: `1d9ec229d9b1f8cc8b16b3e3b289a59f487f76f0f5e2bcd3e21fcee8491237c2`
- required semantic nodes include `CoastOps_Car`, `Door_Front_Left`, `Door_Front_Right`, `Door_Rear_Left`, and `Door_Rear_Right`

The binary is intentionally not embedded in JavaScript. `three-camera.js` leaves the existing SVG camera placeholder visible if the GLB or Three.js runtime cannot load.
