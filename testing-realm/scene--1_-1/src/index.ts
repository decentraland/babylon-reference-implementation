import { AvatarShape, Schemas, Transform, engine } from '@dcl/sdk/ecs'
import { Vector3 } from '@dcl/sdk/math'
export * from '@dcl/sdk'

const CircularComponent = engine.defineComponent('circular movement', {
  x: Schemas.Number,
  z: Schemas.Number,
  speed: Schemas.Number,
  progress: Schemas.Number,
  radius: Schemas.Number
})

engine.addSystem(function Circular(dt) {
  for (const [entity] of engine.getEntitiesWith(CircularComponent)) {
    const data = CircularComponent.getMutable(entity)
    const transform = Transform.getMutable(entity)
    data.progress += dt * data.speed
    transform.position.x = data.x + Math.cos(data.progress) * data.radius
    transform.position.z = data.z + Math.sin(data.progress) * data.radius
    if (transform.position.y > 0) {
      transform.position.y = Math.max(0, transform.position.y - dt * 0.05)
    }
  }
})

let globalTime = 0
engine.addSystem(function Jump(dt) {
  let didHappen = false
  globalTime += dt
  while (globalTime > 3) {
    globalTime -= 3
  }
  if (didHappen)
    for (const [entity] of engine.getEntitiesWith(CircularComponent)) {
      const data = CircularComponent.getMutable(entity)
      const transform = Transform.getMutable(entity)
      if (transform.position.y <= 0.01) {
        transform.position.y += data.radius
      }
    }
})

const avatar1 = engine.addEntity()
Transform.create(avatar1, { position: Vector3.create(8, 0, 8) })
CircularComponent.create(avatar1, {
  x: 8,
  z: 8,
  progress: 0,
  radius: 5,
  speed: -1
})
AvatarShape.create(avatar1, {
  id: 'menduz',
  name: 'menduz',
  wearables: [
    'urn:decentraland:off-chain:base-avatars:sneakers',
    'urn:decentraland:off-chain:base-avatars:eyes_00',
    'urn:decentraland:off-chain:base-avatars:eyebrows_00',
    'urn:decentraland:off-chain:base-avatars:mouth_00',
    'urn:decentraland:off-chain:base-avatars:beard',
    'urn:decentraland:off-chain:base-avatars:triple_ring',
    'urn:decentraland:off-chain:base-avatars:basketball_shorts',
    'urn:decentraland:matic:collections-v2:0x139b7a50c287ccdf6f1e6d9ddb2936a80e2029e1:0',
    'urn:decentraland:matic:collections-v2:0x26676a456bca88e418f9ea4b33a707364c0b5876:1',
    'urn:decentraland:matic:collections-v2:0x26676a456bca88e418f9ea4b33a707364c0b5876:0'],
  emotes: ['urn:decentraland:matic:collections-v2:0x875146d1d26e91c80f25f5966a84b098d3db1fc8:1'],
  bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
  eyeColor: {
    'r': 0.52734375,
    'g': 0.37890625,
    'b': 0.2578125,
  },
  hairColor: {
    'r': 0.234375,
    'g': 0.12890625,
    'b': 0.04296875,
  },
  skinColor: {
    'r': 1,
    'g': 0.8941176533699036,
    'b': 0.7764706015586853,
  }
})

const avatar2 = engine.addEntity()
Transform.create(avatar2, { position: Vector3.create(5, 0, 7) })
CircularComponent.create(avatar2, {
  x: 8,
  z: 8,
  progress: 0,
  radius: 3,
  speed: 0.4
})
AvatarShape.create(avatar2, {
  id: 'naked',
  name: 'naked',
  wearables: [],
  emotes: [],
  bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
  eyeColor: {
    'r': 0.52734375,
    'g': 0.37890625,
    'b': 0.2578125,
  },
  hairColor: {
    'r': 0.234375,
    'g': 0.12890625,
    'b': 0.04296875,
  },
  skinColor: {
    'r': 1,
    'g': 0.8941176533699036,
    'b': 0.7764706015586853,
  }
})

const avatar3 = engine.addEntity()
Transform.create(avatar3, { position: Vector3.create(7, 0, 5) })
AvatarShape.create(avatar3, {
  id: 'naked',
  name: 'naked',
  wearables: [
    "urn:decentraland:off-chain:base-avatars:green_hoodie",
    "urn:decentraland:off-chain:base-avatars:sneakers",
    "urn:decentraland:off-chain:base-avatars:basketball_shorts",
    "urn:decentraland:off-chain:base-avatars:f_eyes_06",
    "urn:decentraland:off-chain:base-avatars:f_eyebrows_07",
    "urn:decentraland:off-chain:base-avatars:mouth_09",
    "urn:decentraland:off-chain:base-avatars:handlebar",
    "urn:decentraland:off-chain:base-avatars:curtained_hair"
  ],
  emotes: [],
  bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
  eyeColor: {
    'r': 1,
    'g': 0,
    'b': 0,
  },
  hairColor: {
    'r': 0,
    'g': 1,
    'b': 0,
  },
  skinColor: {
    'r': 0.8,
    'g': 0.7,
    'b': 0.6,
  }
})

