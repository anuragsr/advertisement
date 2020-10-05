import $ from 'jquery'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

import gsap from 'gsap'
import Stats from 'stats.js'

import GUI from './utils/gui'
import { l, cl } from './utils/helpers'

export default class THREEStarter {
  constructor(opts){
    this.ctn = opts.ctn
    this.w = this.ctn.width()
    this.h = this.ctn.height()
    
    this.clock = new THREE.Clock()
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.rendererCSS = new CSS3DRenderer()

    this.scene = new THREE.Scene()
    this.sceneCSS = new THREE.Scene()

    this.camera = new THREE.PerspectiveCamera(45, this.w / this.h, 1, 5000)

    this.origin = new THREE.Vector3(0, 0, 0)
    this.cameraStartPos = new THREE.Vector3(0, 250, 500)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls2 = new OrbitControls(this.camera, this.rendererCSS.domElement)

    this.axesHelper = new THREE.AxesHelper(500)
    this.axesHelper.material.opacity = .5
    this.axesHelper.material.transparent = true

    this.gridHelper = new THREE.GridHelper( 1000, 50 )
    this.gridHelper.material.opacity = .3
    this.gridHelper.material.transparent = true
    this.gridHelper.name = "Grid Helper"

    this.spotLightMesh1 = this.createMesh(
      new THREE.SphereGeometry(5, 50, 50, 0, Math.PI * 2, 0, Math.PI * 2),
      new THREE.MeshPhongMaterial({ color: 0xffff00 })
    )
    this.spotLight1 = new THREE.DirectionalLight(0xffffff, 1)
    this.lightPos1 = new THREE.Vector3(500, 350, 500)
    this.spotLightMesh2 = this.createMesh(
      new THREE.SphereGeometry(5, 50, 50, 0, Math.PI * 2, 0, Math.PI * 2),
      new THREE.MeshPhongMaterial({ color: 0xffff00 })
    )
    this.spotLight2 = new THREE.DirectionalLight(0xffffff, 1)
    this.lightPos2 = new THREE.Vector3(-500, 350, -500)

    this.currMesh = { name: "Blank" }

    this.stats = new Stats()
    this.stats.showPanel(-1) // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(this.stats.dom)
  }
  init(){
    let show = false
    // Initialize the scene
    this.initScene()
    // Uncomment below 2 lines for testing
    show = true
    this.initGUI()
    this.toggleHelpers(show)
    this.addListeners()
    this.resize()
    this.addObjects()
  }
  initScene(){
    const { 
      ctn, w, h,
      camera, scene, renderer, rendererCSS,
      cameraStartPos, origin, 
      spotLightMesh1, spotLight1, lightPos1,
      spotLightMesh2, spotLight2, lightPos2
    } = this

    // Renderer settings
    renderer.setClearColor(0x000000, 0)
    renderer.setSize(w, h)
    $(renderer.domElement).css({
      position: "absolute",
      top: 0, left: 0, zIndex: 1
    })
    ctn.append(renderer.domElement)

    rendererCSS.setSize(w, h)
    $(rendererCSS.domElement).css({
      position: "absolute",
      top: 0, left: 0
    })
    ctn.append(rendererCSS.domElement)

    // Cameras and ambient light
    camera.position.copy(cameraStartPos)
    camera.lookAt(origin)
    scene.add(camera)    
    scene.add(new THREE.AmbientLight(0xffffff, .2))

    // Spotlight and representational mesh
    spotLightMesh1.position.copy(lightPos1)  
    spotLight1.position.copy(lightPos1)
    scene.add(spotLight1)    
    
    spotLightMesh2.position.copy(lightPos2)
    spotLight2.position.copy(lightPos2)
    scene.add(spotLight2)
  }
  initGUI() {
    const guiObj = new GUI()
    , gui = guiObj.gui
    , params = guiObj.getParams(this.currMesh)

    const he = gui.add(params, 'helpers')
    he.onChange(value => this.toggleHelpers(value))

    gui.add(params, 'getState')

    this.guiObj = guiObj
  }
  toggleHelpers(val){
    const {
      scene, gridHelper, axesHelper, stats,
      spotLightMesh1, spotLightMesh2
    } = this
    if(val){
      scene.add(gridHelper)
      scene.add(axesHelper)
      scene.add(spotLightMesh1)
      scene.add(spotLightMesh2)
      stats.showPanel(0)
    } else{
      scene.remove(gridHelper)
      scene.remove(axesHelper)
      scene.remove(spotLightMesh1)
      scene.remove(spotLightMesh2)
      stats.showPanel(-1)
    }
  }
  render() {
    const { 
      renderer, scene, 
      rendererCSS, sceneCSS, 
      camera, stats, mixer, clock
    } = this
    try{
      stats.begin()
      
      // monitored code goes here      
      renderer.render(scene, camera)
      rendererCSS.render(sceneCSS, camera)
      
      if (mixer) mixer.update(clock.getDelta())
      
      stats.end()
    } catch (err){
      l(err)
      gsap.ticker.remove(this.render.bind(this))
    }
  }
  resize() {
    let {
      w, h, ctn, camera, renderer, rendererCSS
    } = this
    
    w = ctn.width()
    h = ctn.height()
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  
    renderer.setSize(w, h)
    rendererCSS.setSize(w, h)
  }
  addListeners(){
    gsap.ticker.add(this.render.bind(this))
    window.addEventListener("resize", this.resize.bind(this), false)
  }
  createMesh(geometry, material, materialOptions){
    if(materialOptions) {
      let { wrapping, repeat, minFilter } = materialOptions
      material.map.wrapS = material.map.wrapT = wrapping
      material.map.repeat = repeat
      material.map.minFilter = minFilter
    }

    return new THREE.Mesh(geometry, material)
  }
  introduce(obj){ this.scene.add(obj) }  
  introduceCSS3D(obj){ this.sceneCSS.add(obj) }
  addObjects(){
    const { scene, createMesh } = this
    , mgr = new THREE.LoadingManager()
    , mtl = new MTLLoader(mgr)
    , gltf = new GLTFLoader(mgr)
    , createBillBoard = ({ name, billboard, plane, css, scaleFactor }) => {
      // l(name, billboard, plane, css, scaleFactor)
      // Group to move billboard and ad mesh together
      const billGr = new THREE.Group()
      this.introduce(billGr)
      billGr.name = name
      billGr.add(billboard.mesh)

      // Mesh to blend with ad gif
      const adMesh = createMesh(
        new THREE.PlaneGeometry(),
        // Essentially this material creates a 'hole' in our webgl scene to peek 
        // into the CSS scene behind it
        new THREE.MeshBasicMaterial({ 
          // wireframe: true,
          // color: 0xff0000, 
          transparent: true, opacity: 0,
          color: 0x000000, blending: THREE.NoBlending 
        })
      )
      adMesh.name = "Plane"
      billGr.add(adMesh)

      const { scale: sc, pos: ps } = plane
      // Set scale to fit ad gif
      adMesh.scale.set(sc[0], sc[1], sc[2])
      // Set position relative to billboard model
      adMesh.position.set(ps[0], ps[1], ps[2])

      // transforms for the group
      const { pos, rot } = billboard
      billGr.position.set(pos[0], pos[1], pos[2])
      billGr.rotation.set(rot[0], rot[1], rot[2])
      billGr.scale.multiplyScalar(scaleFactor)
      billGr.updateMatrixWorld()

      // Get world coordinates of the ad mesh 
      const targetPos = new THREE.Vector3()
      adMesh.getWorldPosition(targetPos)

      // Add ad gif to CSS3D scene
      const { id, scale, offset } = css
      const cssObject = new CSS3DObject(document.getElementById(id))
      this.introduceCSS3D(cssObject)
      
      // Copy world coordinates of the ad mesh to the ad gif
      cssObject.position.copy(targetPos)
      if(offset){
        cssObject.position.x+= offset[0]
        cssObject.position.y+= offset[1]
        cssObject.position.z+= offset[2]
      }
      cssObject.rotation.copy(billGr.rotation)
      // To fit into the ad mesh
      cssObject.scale.multiplyScalar(scale)
      // To scale with the billboard group
      cssObject.scale.multiplyScalar(scaleFactor)

      return billGr
    }
    , addBillboards = () => {
      mtl.load("assets/models/billboards/b1/untitled.mtl", materials => {
        materials.preload()
        new OBJLoader().setMaterials(materials)
        .load("assets/models/billboards/b1/untitled.obj", object => {
          // Billboard model - normalize size, scale down later
          const bb = object 
          bb.name = "Billboard"
          bb.scale.multiplyScalar(20)
          bb.rotation.y = Math.PI 
          
          const gr = createBillBoard({
            name: "Billboard Group 1 (Adidas)",
            billboard: { mesh: bb, pos: [0, 0, 0], rot: [0, 0, 0] },
            plane: { scale: [160, 65, 0], pos: [0, 148, 8] },
            css: { scale: .27, id: "bill1" }, scaleFactor: .5
          })

          l(gr)

          const gr2 = createBillBoard({
            name: "Billboard Group 4 (Converse)",
            billboard: { mesh: bb.clone(), pos: [0, 100, 0], rot: [0, 0, 0] },
            plane: { scale: [129, 65, 0], pos: [0, 148, 8] },
            css: { scale: .27, offset: [-.15, 0, 0], id: "bill4" }, scaleFactor: .5
          })

          l(gr2)

          const gr3 = createBillBoard({
            name: "Billboard Group 6 (Nike)",
            billboard: { mesh: bb.clone(), pos: [100, 140, 0], rot: [0, 0, 0] },
            plane: { scale: [129, 65, 0], pos: [0, 148, 8] },
            css: { scale: .28, offset: [-.15, 0, 0], id: "bill6" }, scaleFactor: .5
          })

          l(gr3)

          const gr4 = createBillBoard({
            name: "Billboard Group 7 (KFC)",
            billboard: { mesh: bb.clone(), pos: [-190, 0, 0], rot: [0, 0, 0] },
            plane: { scale: [129, 65, 0], pos: [0, 148, 8] },
            css: { scale: .28, offset: [-.15, 0, 0], id: "bill7" }, scaleFactor: .5
          })

          l(gr4)
        })
      })
      
      // Double Sided billboard
      gltf.load('assets/models/billboards/b2/scene.glb', obj => { 
        // Billboard model - normalize size, scale down later
        const bb = obj.scene
        bb.name = "Billboard"
        bb.scale.multiplyScalar(10)
        bb.rotation.y = - Math.PI / 2

        const gr = createBillBoard({
          name: "Billboard Group 2 (Nike)",
          billboard: { mesh: bb, pos: [100, 0, 0], rot: [0, 0, 0] },
          plane: { scale: [75, 44, 0], pos: [0, 100, 2] },
          css: { scale: .05, id: "bill2" }, scaleFactor: 1
        })

        l(gr)

        const gr2 = createBillBoard({
          name: "Billboard Group 3 (Coca Cola)",
          billboard: { mesh: bb.clone(), pos: [-100, 0, 0], rot: [0, 0, 0] },
          plane: { scale: [80, 42, 0], pos: [0, 100, 2] },
          css: { scale: .2, offset: [0, -4.8, 0], id: "bill3" }, scaleFactor: .8
        })

        l(gr2)

        const gr3 = createBillBoard({
          name: "Billboard Group 5 (North Face)",
          billboard: { mesh: bb.clone(), pos: [-100, 120, 0], rot: [0, 0, 0] },
          plane: { scale: [80, 42, 0], pos: [0, 100, 2] },
          css: { scale: .14, id: "bill5" }, scaleFactor: .8
        })

        l(gr3)
      })

      // Auto animated billboard
      gltf.load('assets/models/billboards/b3/scene.gltf', obj => { 
        const bb = obj.scene 
        this.mixer = new THREE.AnimationMixer(bb)                

        // Play a specific animation
        const clips = obj.animations
        const clip = THREE.AnimationClip.findByName(clips, 'Take 001' )
        const action = this.mixer.clipAction(clip)
        action.play()

        bb.name = "Billboard Animated"
        bb.scale.multiplyScalar(.15)
        bb.position.set(200, 200, 0)
        bb.rotation.set(0, -Math.PI / 2, 0)
        this.introduce(bb)
      })

      mtl.load("assets/models/billboards/b4/untitled.mtl", materials => {
        materials.preload()
        new OBJLoader().setMaterials(materials)
        .load("assets/models/billboards/b4/untitled.obj", object => {
          // Billboard model - normalize size, scale down later
          const bb = object 
          bb.name = "Billboard"
          bb.scale.multiplyScalar(20)
          bb.rotation.y = Math.PI 
          
          const gr = createBillBoard({
            name: "Billboard Group 8 (Adidas)",
            billboard: { mesh: bb, pos: [-200, 100, 0], rot: [0, 0, 0] },
            plane: { scale: [143, 108, 0], pos: [0, 167.5, 8] },
            css: { scale: .18, id: "bill8" }, scaleFactor: .5
          })

          l(gr)

          const gr2 = createBillBoard({
            name: "Billboard Group 9 (Zeta Office)",
            billboard: { mesh: bb.clone(), pos: [0, 200, 0], rot: [0, 0, 0] },
            plane: { scale: [109, 107, 0], pos: [0, 167.5, 8] },
            css: { scale: .17, id: "bill9" }, scaleFactor: .5
          })

          l(gr2)
        })
      })
      
    }
    
    mgr.onError = url => {
      l('There was an error loading ' + url)
    }

    (() => {
      // Billboards
      addBillboards()
    })()
  }
}