import { Vector3, Quaternion } from "@babylonjs/core";
import { transformComponent } from "../../../decentraland/sdk-components/transform-component";
import type { SceneContext } from "../scene-context";
import { globalCoordinatesToSceneCoordinates } from "../coordinates";
import { Entity } from "../../../decentraland/types";
import { engineInfoComponent } from "../../../decentraland/sdk-components/engine-info";

export const StaticEntities = {
  RootEntity: 0 as Entity,
  PlayerEntity: 1 as Entity,
  CameraEntity: 2 as Entity,
} as const

export const PLAYER_HEIGHT = 1.6

/**
 * This function updates the static entities to be reported back to the scene once
 * per frame and when the scene asks for the initial state.
 */
export function updateStaticEntities(context: SceneContext) {
  const EngineInfo = context.components[engineInfoComponent.componentId]

  if (!EngineInfo.has(StaticEntities.RootEntity))
    EngineInfo.create(StaticEntities.RootEntity, { frameNumber: 0, tickNumber: 0, totalRuntime: 0 })

  const info = EngineInfo.getMutable(StaticEntities.RootEntity)

  info.tickNumber = context.currentTick
  info.totalRuntime = context.getElapsedTime()
  info.frameNumber = context.babylonScene.getEngine().frameId - context.startFrame

  const Transform = context.components[transformComponent.componentId]

  if (!Transform.has(StaticEntities.CameraEntity))
    Transform.create(StaticEntities.CameraEntity, { position: Vector3.Zero(), scale: Vector3.One(), rotation: Quaternion.Identity(), parent: StaticEntities.RootEntity })
  if (!Transform.has(StaticEntities.PlayerEntity))
    Transform.create(StaticEntities.PlayerEntity, { position: Vector3.Zero(), scale: Vector3.One(), rotation: Quaternion.Identity(), parent: StaticEntities.RootEntity })

  const engineCamera = context.babylonScene.activeCamera

  // StaticEntities.PlayerEntity
  {
    // for now, until we have a proper Player, simply copy the position of the player by
    // removing the camera height from its position. the PlayerEntity is located at the foot of the avatar
    const playerTransform = Transform.getMutable(StaticEntities.PlayerEntity)

    // convert the camera position to scene-space coordinates
    playerTransform.position = globalCoordinatesToSceneCoordinates(context, engineCamera!.position.subtractFromFloats(0, PLAYER_HEIGHT, 0))
  }

  // StaticEntities.CameraEntity
  {
    const cameraTransform = Transform.getMutable(StaticEntities.CameraEntity)

    engineCamera?.getWorldMatrix().decompose(
      undefined,
      cameraTransform.rotation,
      cameraTransform.position
    )

    // convert the camera position to scene-space coordinates
    cameraTransform.position = globalCoordinatesToSceneCoordinates(context, cameraTransform.position)

    cameraTransform.scale.setAll(1)
  }
}

