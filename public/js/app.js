 //** GLand - Computer Graphics 2020 NNU Project **//
  //**********************************************//

  // Container setup
  var container = document.querySelector(".scene");

  // Controls menu setup
  var gui = new dat.GUI();

  var backgroundColor = '#dbdbdb';

  const colorsFolder = gui.addFolder('Colors');
  colorsFolder.addColor(this, 'backgroundColor').name('Background').onChange((color) =>
  { document.body.style.backgroundColor = color;  });

  // Create scene
  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2( 0xcccccc, 0.001 );

  //Camera setup
  const fov = 40;
  const aspect = window.innerWidth / window.innerHeight;
  const near = 1;
  const far = 10000;

  var camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  // camera.rotation.x = 95/180*Math.PI;
  camera.position.x = 300;
  camera.position.y = 150;
  camera.position.z = 150;

  //Audio Setup
  var listener = new THREE.AudioListener();
  camera.add( listener );

  var sound = new THREE.Audio( listener );

  var audioLoader = new THREE.AudioLoader();
  audioLoader.load( 'assets/music.mp3', function( buffer )
  {
	sound.setBuffer( buffer );
	sound.setLoop( true );
	sound.setVolume( 0 );
	sound.play();
  });

  // Performance Monitor
  var stats = new Stats();
  stats.showPanel( 0 );
  container.appendChild( stats.dom );

  // ِِAmbient light setup
  const ambient = new THREE.AmbientLight(0x404040, 1.5);
  scene.add(ambient);

  // Rotating Sun light setup
  var sun = new THREE.Vector3();

  var width = 35;
  var height = 35;
  var intensity = 20;
  var rectLight = new THREE.RectAreaLight( 0xffffe0, intensity,  width, height );
  rectLight.position.set( 5, 5, 0 );
  scene.add( rectLight );

  var rectLightMesh = new THREE.Mesh( new THREE.SphereBufferGeometry(1,32,32), new THREE.MeshBasicMaterial( { side: THREE.BackSide, color: 0xffffe0 } ) );
  rectLightMesh.scale.x = rectLight.width;
  rectLightMesh.scale.y = rectLight.height;
  rectLight.add( rectLightMesh );

  var rectLightMeshBack = new THREE.Mesh( new THREE.SphereBufferGeometry(1,32,32), new THREE.MeshBasicMaterial( { color: 0xffffff } ) );
  rectLightMesh.add( rectLightMeshBack );


  param = {
	color: rectLight.color.getHex(),
	intensity: rectLight.intensity,
	'ambient': ambient.intensity,
  };


  colorsFolder.addColor(param, 'color' ).name('Sun Color').onChange( function ( val )
  {    rectLight.color.setHex( val );
       rectLightMesh.material.color.copy( rectLight.color ).multiplyScalar( rectLight.intensity );
  });
  colorsFolder.open();

  var lightFolder = gui.addFolder( 'Light' );
  lightFolder.add( param, 'intensity', 0.0, 400.0 ).name('Sun Intensity').step( 1 ).onChange( function ( val )
  {    rectLight.intensity = val;
       rectLightMesh.material.color.copy( rectLight.color ).multiplyScalar( rectLight.intensity );
  });

  lightFolder.add( param, 'ambient', 0.0, 4 ).name('Ambient Intensity').step( 0.1 ).onChange( function ( val )
  {  ambient.intensity = val;
  });

  lightFolder.open();


  // Directional light setup
  const directional = new THREE.DirectionalLight( 0xaabbff, 2 );
  directional.position.set(50, 50, 100);
  // directional.castShadow = true;
  // directional.shadow.camera.far = 1000;
  // directional.shadow.camera.near = -200;
  // directional.shadow.camera.left = -40;
  // directional.shadow.camera.right = 40;
  // directional.shadow.camera.top = 20;
  // directional.shadow.camera.bottom = -20;
  // directional.shadow.camera.zoom = 1;
  // directional.shadow.camera.needsUpdate = true;
  scene.add(directional);

  //Renderer setup
  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(window.devicePixelRatio);
  // renderer.outputEncoding = THREE.sRGBEncoding;
  container.appendChild(renderer.domElement);

  //Pointy things
  var geometry = new THREE.CylinderBufferGeometry( 0, 10, 30, 4, 1 );
  var material = new THREE.MeshPhongMaterial( { color: 0x404040, flatShading: true } );
  for ( var i = 0; i < 500; i ++ )
  {
	var mesh = new THREE.Mesh( geometry, material );
	mesh.position.x = Math.random() * 1600 - 800;
	mesh.position.y = 0;
	mesh.position.z = Math.random() * 1600 - 800;
	mesh.updateMatrix();
	mesh.matrixAutoUpdate = false;
	scene.add(mesh);
  }

  var params = {
      modelcolor: "#404040",
      flatShading: true
  };

  colorsFolder.addColor(params, 'modelcolor').name('Pointy Things').onChange(
    function()
    { material.color.set(params.modelcolor);
    });

  //Load model
  let loader = new THREE.GLTFLoader();
  loader.load("assets/nnu.glb", function(gltf)
  {
      scene.add(gltf.scene);
      var model = gltf.scene.children[0];
      gltf.scene.position.set(0,-415,150)
      gltf.scene.rotation.y = 0.5;
	  gltf.scene.castShadow = true;
	  gltf.scene.receiveShadow = true;

      animate();
  });


  // Orbit controls setup
  var controls	= new THREE.OrbitControls(camera , renderer.domElement)
  controls.minDistance = 100;
  controls.maxDistance = 800;
  controls.maxPolarAngle = Math.PI / 2;

  // controls.update();

  //Sky
  var vertexShader = document.getElementById( 'vertexShader' ).textContent;
  var fragmentShader = document.getElementById( 'fragmentShader' ).textContent;
  var uniforms = {
    	topColor: { value: new THREE.Color( 0x0077ff ) },
    	bottomColor: { value: new THREE.Color( 0xcccccc  ) },
    	offset: { value: 400 },
    	exponent: { value: 0.6 }
  };
  uniforms.topColor.value.copy( directional.color );

  var skyGeo = new THREE.SphereBufferGeometry( 4000, 32, 15 );
  var skyMat = new THREE.ShaderMaterial( {
    	uniforms: uniforms,
    	vertexShader: vertexShader,
    	fragmentShader: fragmentShader,
    	side: THREE.BackSide
  });
  var sky = new THREE.Mesh( skyGeo, skyMat );
  scene.add( sky );

  //Responsive window resize
  function onWindowResize()
  {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener("resize", onWindowResize);

  //Render animate loop
  function animate()
  {
      stats.begin();
      requestAnimationFrame(animate);

      var t = ( Date.now() / 2000 );
      var r = 350.0;

      var lx = r * Math.cos( t );
      var lz = r * Math.sin( t );
      var ly = 150.0 + 150.0 * Math.sin( t / 3.0 );

      rectLight.position.set( lx, ly, lz );
      rectLight.lookAt( sun );


      renderer.render(scene, camera);
      stats.end();
  }
