import React, { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { useGLTF } from '@react-three/drei'
import SimplexNoise from 'simplex-noise'
import gsap from 'gsap'

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}
const simplex = new SimplexNoise()

const Plane = () => {
  const planeArgs = useRef({
    side: THREE.DoubleSide,
    color: '#ffffff'
  })

  return (
    <mesh>
      <planeBufferGeometry args={[1000, 1000]}/>
      <meshPhongMaterial args={[planeArgs.current]}/>
    </mesh>
  )
}

const Stones = ({pointLight}) => {
  const gltf = useLoader(GLTFLoader, '/stones/scene.gltf')
  const {nodes, materials} = useGLTF('/stones/scene.gltf')
  const [stones, setStones] = useState([])
  const [stoneDisplacement, setStoneDisplacement] = useState([])

  useEffect(() => {
    if (gltf) {
      const bufferStones = []
      const bufferStoneDisplasement = []
      for (let i = 0; i < 1000; ++i) {
        let currentMesh = gltf.scene.clone()
        let scale = (Math.random() * 1.2) / 200

        let xPos = Math.random() * (50 - 5) + 25
        let yPos = Math.random() * (50 - 5) + 25

        // currentMesh.position.x = xPos
        // currentMesh.position.y = yPos

        currentMesh.position.x = pointLight.current.position.x
        currentMesh.position.y = pointLight.current.position.y

        currentMesh.rotation.x = Math.PI * Math.random()
        currentMesh.rotation.y = Math.PI * Math.random()

        currentMesh.scale.set(scale, scale, scale)

        let displacement = {x: Math.random(), y: Math.random()}
        bufferStoneDisplasement.push(displacement)
        bufferStones.push(currentMesh)
      }
      setStones(bufferStones)
      setStoneDisplacement(bufferStoneDisplasement)
    }
  }, [gltf])

  useFrame(({gl, scene,camera, clock}) => {
    const elapsedTime = clock.elapsedTime * 0.2

    for (let i = 0; i < stones.length; ++i) {
      const stone = stones[i]
      const displacement = stoneDisplacement[i]
      const lerpSpeed = 0.0125 / (Math.sin(displacement.y) + Math.cos(displacement.x)) //скор-ть задержки движения частиц за курсором

      // const targetXPos = pointLight.current.position.x + (Math.cos(elapsedTime * 5 + i * 5) * displacement.x * 30)
      // const targetYPos = pointLight.current.position.y + (Math.sin(elapsedTime * 5 + i) * displacement.y * 20)

      let targetXPos = pointLight.current.position.x
      let targetYPos = pointLight.current.position.y
      targetXPos += simplex.noise2D(elapsedTime, elapsedTime * 0.08 + i) * 30 * Math.sin(simplex.noise2D(elapsedTime, elapsedTime) + i) * 2
      targetYPos += simplex.noise2D(elapsedTime * 0.06 + i, elapsedTime) * 30 * Math.cos(simplex.noise2D(elapsedTime, elapsedTime) + i) * 2

      // const targetXPos = pointLight.current.position.x * elapsedTime + (Math.cos(i) * 20 )
      // const targetYPos = pointLight.current.position.y * elapsedTime + (Math.sin(i) * 20 )

      // const targetXPos = pointLight.current.position.x + (Math.random() - 0.5) * 10.0
      // const targetYPos = Math.cos(pointLight.current.position.y) + (Math.sin(elapsedTime * 5 + i * 5) * displacement.y * 30)


      const rotationSpeed = new THREE.Vector3(10, Math.random() * 10, Math.random() * 10)

      stone.position.x = new THREE.Vector3().lerpVectors(
        stone.position,
        new THREE.Vector3(targetXPos, 0, 0),
        lerpSpeed
      ).x * 1.002
      stone.position.y = new THREE.Vector3().lerpVectors(
        stone.position,
        new THREE.Vector3(0, targetYPos, 0),
        lerpSpeed
      ).y
      stone.position.z = new THREE.Vector3().lerpVectors(
        stone.position,
        new THREE.Vector3(0, targetYPos, 0),
        lerpSpeed
      ).z

      stone.rotation.x += Math.PI * displacement.x * elapsedTime * 0.8 * Math.random() / (rotationSpeed.x * 20)
      stone.rotation.y += Math.PI * displacement.y * elapsedTime * Math.random() / (rotationSpeed.x * 20)
      // stone.rotation.z += Math.PI * displacement.x / (rotationSpeed.z * 20)
    }

    gl.render(scene, camera)

  }, 1)

  return (
    <>
      {stones.map(stone => (<primitive key={stone.uuid} object={stone}/>))}
    </>
  )
}

const Mouse = ({pointLight}) => {
  const {camera} = useThree()
  const mouse = useRef(new THREE.Vector2(0, 0))

  const eMouse = useRef(new THREE.Vector2(0,0))
  const elasticMouse = useRef(new THREE.Vector2(0,0))
  const temp = useRef(new THREE.Vector2(0,0))
  const elasticMouseVelocity = useRef(new THREE.Vector2(0,0))

  const mouseMove = (event) => {
    mouse.current = {
      x: (event.clientX / window.innerWidth) * 2 - 1,
      y: -(event.clientY / window.innerHeight) * 2 + 1,
    }

    let vector = new THREE.Vector3(mouse.current.x, mouse.current.y, 0.1)
    vector.unproject(camera)
    let direction = vector.sub(camera.position).normalize()
    let distance = -camera.position.z / direction.z
    let position = camera.position.clone().add(direction.multiplyScalar(distance))

    eMouse.current.x = mouse.current.x * 60
    eMouse.current.y = mouse.current.y * 30

    pointLight.current.position.copy(new THREE.Vector3(position.x, position.y, position.z + 0.5))
  }

  useLayoutEffect(() => {
    window.addEventListener('mousemove', mouseMove)
    return () => {
      window.removeEventListener('mousemove', mouseMove)
    }
  }, [])

  useFrame(() => {
    temp.current.copy(eMouse.current).sub(elasticMouse.current).multiplyScalar(0.15)

    elasticMouseVelocity.current.add(temp.current)
    elasticMouseVelocity.current.multiplyScalar(0.8)
    elasticMouse.current.add(elasticMouseVelocity.current)

    pointLight.current.position.x = elasticMouse.current.x
    pointLight.current.position.y = elasticMouse.current.y
  })

  return (
    <></>
  )
}

const colors = [
  '#229794',
  '#782297',
  '#f3f2f2',
]

const Scene = () => {
  const pointLight = useRef()
  const [cursorColor, setCursorColor] = useState(colors[0])

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{fov: 90, position: [0, 0, 32], near: 0.1, far: 1000}}
    >
      {/*<ambientLight intensity={0.1}/>*/}
      <pointLight
        ref={pointLight}
        intensity={2}
        position={[0, 0, 0.1]}
        color={cursorColor}
        distance={60}
      />
      <color attach="background" args={['#202020']}/>
      {/*<OrbitControls/>*/}
      <Mouse pointLight={pointLight}/>
      <Suspense fallback={null}>
        <Plane/>
        <Stones pointLight={pointLight}/>
      </Suspense>
    </Canvas>
  )
}

export const App = () => {
  return (
    <>
      <Scene/>
      <div className="title">DARTCORP</div>
    </>
  );
}

