# snapshot test for testing-realm/scene-0_0/src/tests/camera-position.test.js
```mermaid
sequenceDiagram
  participant runtime
  participant scene
  participant renderer
  participant babylon
  scene-->>runtime: require("buffer")
  scene-->>runtime: require("long")
  scene-->>runtime: require("~system/Testing")
  scene-->>runtime: require("~system/EngineApi")
  scene-->>runtime: require("~system/EngineApi")
  runtime-->>scene: onStart()
  activate scene
  activate renderer
  scene-->>renderer: crdtGetState()
    renderer-->>scene: PUT c=1 e=0x2 t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
  deactivate renderer
  deactivate scene

  runtime-->>scene: onUpdate(0) frameNumber=0
  activate scene
  loop Run Systems
  scene-->>scene: engine.update()
    babylon-->>renderer: render()
    babylon-->>renderer: lateRender()
  end
  scene->>renderer: crdtSendToRenderer()
  activate renderer
    babylon-->>renderer: render()
    babylon-->>renderer: lateRender()
    renderer-->>scene: PUT c=1 e=0x2 t=3 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
  deactivate renderer
  deactivate scene

  runtime-->>scene: onUpdate(0.5) frameNumber=1
  activate scene
  loop Run Systems
  scene-->>scene: engine.update()
  Note right of scene: "🧪 Running test sanity: test camera position is updated"
   # [setCameraTransform]{"position":{"x":1,"y":1,"z":1},"rotation":{"x":0.08682408883346517,"y":0.08682408883346517,"z":-0.007596123493895969,"w":0.9924038765061041}}
  Note right of scene: "⏱️ yield promise"
  end
  scene->>renderer: crdtSendToRenderer()
  activate renderer
    babylon-->>renderer: render()
    babylon-->>renderer: lateRender()
    renderer-->>scene: PUT c=1 e=0x2 t=4 #v={"position":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"rotation":{"_isDirty":true,"_x":0.08682409673929214,"_y":0.08682409673929214,"_z":-0.007596122566610575,"_w":0.9924038648605347},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
  deactivate renderer
  deactivate scene

  runtime-->>scene: onUpdate(0.5) frameNumber=2
  activate scene
  loop Run Systems
  scene-->>scene: engine.update()
  end
  scene->>renderer: crdtSendToRenderer()
  activate renderer
  Note right of scene: "⏱️ yield"
    babylon-->>renderer: render()
    babylon-->>renderer: lateRender()
    renderer-->>scene: PUT c=1 e=0x2 t=5 #v={"position":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"rotation":{"_isDirty":true,"_x":0.08682409673929214,"_y":0.08682409673929214,"_z":-0.007596122566610575,"_w":0.9924038648605347},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
  deactivate renderer
  deactivate scene

  runtime-->>scene: onUpdate(0.5) frameNumber=3
  activate scene
  loop Run Systems
  scene-->>scene: engine.update()
  Note right of scene: "🟢 Test passed sanity: test camera position is updated"
  # [TEST RESULT]{"name":"sanity: test camera position is updated","ok":true,"totalFrames":2,"totalTime":1}
  end
  scene->>renderer: crdtSendToRenderer()
  activate renderer
    babylon-->>renderer: render()
    babylon-->>renderer: lateRender()
    renderer-->>scene: PUT c=1 e=0x2 t=6 #v={"position":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"rotation":{"_isDirty":true,"_x":0.08682409673929214,"_y":0.08682409673929214,"_z":-0.007596122566610575,"_w":0.9924038648605347},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
  deactivate renderer
  deactivate scene
```

The file that produced this snapshot was:
```typescript
import { test } from "@dcl/sdk/testing";
import { Quaternion, Vector3 } from "@dcl/sdk/math";
export * from '@dcl/sdk'

test("sanity: test camera position is updated", function* (_) {
  yield _.setCameraTransform({
    position: Vector3.One(),
    rotation: Quaternion.fromEulerDegrees(10, 10, 0),
  })
})

```