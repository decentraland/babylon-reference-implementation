import "@babylonjs/inspector"
import { initEngine } from "../lib/babylon";
import { loginAsGuest, loginUsingEthereumProvider } from "../lib/decentraland/identity/login";
import { loadedScenesByEntityId, setCurrentIdentity, userIdentity } from "./state";
import { createCommunicationsPositionReportSystem } from "../lib/decentraland/communications/position-report-system";
import { createNetworkedProfileSystem } from "../lib/decentraland/communications/networked-profile-system";
import { downloadAvatar, generateRandomAvatar } from "../lib/decentraland/identity/avatar";
import { addSystems } from "../lib/decentraland/system";
import { createAvatarVirtualSceneSystem } from "../lib/decentraland/communications/comms-virtual-scene-system";
import { createAvatarRendererSystem } from "../lib/babylon/avatar-rendering-system";
import { createRealmCommunicationSystem } from "../lib/decentraland/communications/realm-communications-system";
import { loadSceneContext, unloadScene } from "../lib/babylon/scene/load";
import { createSceneCullingSystem } from "../lib/babylon/scene/scene-culling";
import { createSceneTickSystem } from "../lib/babylon/scene/update-scheduler";
import { scenesUrn as avatarSceneRealmSceneUrns } from "./avatar-scene.json";
import { PLAYER_HEIGHT } from "../lib/babylon/scene/logic/static-entities";
import { Atom } from "../lib/misc/atom";
import { pickWorldSpawnpoint } from "../lib/decentraland/scene/spawn-points";
import { Scene } from "@dcl/schemas";
import { addChat } from "./console";

// we only spend ONE millisecond per frame procesing messages from scenes,
// it is a conservative number but we want to prioritize CPU time for rendering
const MS_PER_FRAME_PROCESSING_SCENE_MESSAGES = 1
export const microphone = Atom<MediaStream>()

// this is our entry point

declare var ethereum: any

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement // Get the canvas element
const startButton = document.getElementById('start-button') as HTMLButtonElement
const startButtonMetamask = document.getElementById('start-button-user') as HTMLButtonElement
const uiContainer = document.getElementById('ui') as HTMLDivElement

startButtonMetamask.onclick = (e) => {
  startButtonMetamask.disabled = true
  startButton.disabled = true
  startButtonMetamask.innerText = 'Sign the message...'

  ethereum.enable().then(() => {
    main().then(() => {
      // TODO: memoize the result of the loginAsGuest in localStorage, right now it generates
      // a new identity each time we reload the page
      loginUsingEthereumProvider(ethereum).then(identity => {
        setCurrentIdentity(identity)
        canvas.style.visibility = 'visible'
        uiContainer.remove()
      })
    })
  })
}

startButton.onclick = (e) => {
  startButtonMetamask.disabled = true
  startButton.disabled = true
  startButton.innerText = 'Loading...'

  main().then(() => {
    // TODO: memoize the result of the loginAsGuest in localStorage, right now it generates
    // a new identity each time we reload the page
    loginAsGuest().then(identity => {
      setCurrentIdentity(identity)
      canvas.style.visibility = 'visible'
      uiContainer.remove()
    })
  })
}

async function main() {
  // <WIRING>
  const { scene, firstPersonCamera, audioContext } = await initEngine(canvas)
  const gameConsole = addChat(canvas)

  const realmCommunicationSystem = createRealmCommunicationSystem(userIdentity, scene, microphone, audioContext)
  const networkedPositionReportSystem = createCommunicationsPositionReportSystem(realmCommunicationSystem.getTransports, firstPersonCamera)
  const networkedProfileSystem = createNetworkedProfileSystem(realmCommunicationSystem.getTransports)
  const avatarVirtualScene = createAvatarVirtualSceneSystem(realmCommunicationSystem.getTransports, gameConsole.addConsoleMessage)
  const avatarRenderingSystem = createAvatarRendererSystem(scene, () => loadedScenesByEntityId.values())
  const sceneCullingSystem = createSceneCullingSystem(scene, () => loadedScenesByEntityId.values())
  const sceneTickSystem = createSceneTickSystem(scene, () => loadedScenesByEntityId.values(), MS_PER_FRAME_PROCESSING_SCENE_MESSAGES)

  gameConsole.onChatMessage.add(message => {
    const transports = Array.from(realmCommunicationSystem.getTransports())
    for (const t of transports) {
      t.sendChatMessage({ timestamp: Date.now(), message })
      gameConsole.addConsoleMessage({ message: `You: ${message}`, isCommand: false, color: 0x00cece })
    }
  })

  realmCommunicationSystem.currentRealm.observable.add(realm => {
    gameConsole.addConsoleMessage({ message: `🌐 Connected to realm ${realm.configurations?.realmName}`, isCommand: false })
  })

  addSystems(scene,
    // the realmCommunicationSystem is in charge to handle realm connections and connect/disconnect transports accordingly.
    realmCommunicationSystem,

    // as its name implies, the networked position report system is in charge of
    // broadcasting our position to the rest of the network
    networkedPositionReportSystem,

    // the networked profile system is in charge of announcing updates in our local
    // profile to the rest of the network
    networkedProfileSystem,

    // the avatar virtual scene contains all the player entities (via comms) that are
    // broadcasted/replicated to the rest of the running scenes
    avatarVirtualScene,

    // this system executes the update and lateUpdate functions as defined in ADR-148
    sceneTickSystem,

    // the avatar rendering system iterates over all the AvatarShape of all scenes and marks
    // them as visible or invisible
    avatarRenderingSystem,

    // the sceneCullingSystem uses the base parcels of the scene to cull the 
    // RootEntity and all its descendants
    sceneCullingSystem,
  )

  // when the realm changes, we need to destroy extra scenes and load the new ones
  realmCommunicationSystem.currentRealm.observable.add(async realm => {
    // create an empty set of desired running scenes
    const desiredRunningScenes = new Map<string, { isGlobal: boolean }>()

    // first load the desired scenes into the desiredRunningScenes set
    avatarSceneRealmSceneUrns.forEach(urn => desiredRunningScenes.set(urn, { isGlobal: true }))
    realm.configurations?.scenesUrn.forEach(urn => desiredRunningScenes.set(urn, { isGlobal: false }))
    realm.configurations?.globalScenesUrn.forEach(urn => desiredRunningScenes.set(urn, { isGlobal: true }))

    // destroy all unwanted scenes, copy the loadedScenesByEntityId into an array to avoid
    // errors caused by mutations of the loadedScenesByEntityId
    for (const entityId of Array.from(loadedScenesByEntityId.keys())) {
      if (!desiredRunningScenes.has(entityId))
        unloadScene(entityId)
    }

    // now that all unwanted scenes are destroyed, load the new realm
    for (const [urn, { isGlobal }] of desiredRunningScenes) {
      await loadSceneContext(scene, { urn, isGlobal }, avatarVirtualScene)
    }

    // finally teleport to a location in the new realm. pick the first non-global scene
    for (const [_, loadedScene] of loadedScenesByEntityId) {
      if (!loadedScene.isGlobalScene) {
        loadedScene.crdtSendToRenderer({ data: Uint8Array.of() }).then(() => {
          const { position } = pickWorldSpawnpoint(loadedScene.loadableScene.entity.metadata as Scene)

          scene.activeCamera!.position.copyFrom(position)
          scene.activeCamera!.position.y += PLAYER_HEIGHT
        })
        break
      }
    }
  })

  // generate a random avatar based on our identity
  userIdentity.observable.add(async identity => {
    if (identity.isGuest)
      networkedProfileSystem.setAvatar(await generateRandomAvatar(identity.address))
    else
      networkedProfileSystem.setAvatar(await downloadAvatar(identity.address))
  })

  configureRealmSelectionUi(realmCommunicationSystem.connectRealm)
  // </WIRING>
}

function configureRealmSelectionUi(changeRealm: (connectionString: string) => Promise<any>) {
  const realmInput = document.getElementById('realm-input') as HTMLInputElement
  const url = new URLSearchParams(location.search)
  if (url.has('realm')) {
    realmInput.value = url.get('realm')!
  }

  // UI bindings
  async function uiChangeRealm() {
    realmInput.setAttribute('disabled', 'true')
    try {
      const url = await changeRealm(realmInput.value)
      realmInput.value = url
    } finally {
      realmInput.removeAttribute('disabled')
    }
  }

  realmInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      uiChangeRealm()
    }
  })

  setTimeout(uiChangeRealm, 0)
  setTimeout(configureMicrophoneSelector, 0)
}

function configureMicrophoneSelector() {
  const selector = document.getElementById('microphone')
  // List cameras and microphones.
  navigator.mediaDevices.enumerateDevices().then((devices) => {
    selector!.innerHTML =
      `<option selected disabled>- Select your microphone -</option>` +
      devices
        .filter((device) => device.kind === 'audioinput')
        .map((device) => {
          const isSelected = device.deviceId
          return `<option value="${device.deviceId}" ${isSelected}>${device.label || 'Generic microphone'}</option>`
        }).join('')
  })

  selector!.onchange = (a) => {
    const deviceId = (a.target as HTMLSelectElement).value

    selector!.setAttribute('disabled', 'disabled')

    navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId,
        channelCount: 1,
        sampleRate: 24000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        advanced: [{ echoCancellation: true }, { autoGainControl: true }, { noiseSuppression: true }] as any
      },
      video: false
    }).then($ => {
      microphone.swap($)
      selector!.setAttribute('disabled', 'disabled')
    }).catch($ => {
      console.error($)
      selector!.removeAttribute('disabled')
    })

  }
}