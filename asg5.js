import * as THREE from './lib/three.module.js';
import { OrbitControls } from './lib/OrbitControls.js';
import { OBJLoader } from './lib/OBJLoader.js';
import { MTLLoader } from './lib/MTLLoader.js';

function main() {
    // Set up renderer
    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.shadowMap.enabled = true;
    
    // Create scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xD0C9B9, 30, 100); 

    // Set up camera and controls
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 20, 40);
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    
    // Function to generate a random color
    function getRandomColor() {
        return new THREE.Color(Math.random(), Math.random(), Math.random());
    }

    canvas.addEventListener('click', (event) => {
        // Get the mouse position in normalized device coordinates (-1 to +1) for both components
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Set up a raycaster to detect objects under the mouse cursor
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera); // Correct method to set raycaster's origin and direction

        // Check for intersections with all objects in the scene
        const intersects = raycaster.intersectObjects(scene.children, true);

        if (intersects.length > 0) {
            // Change the color of the first intersected object to a random color
            const object = intersects[0].object;
            object.material.color.set(getRandomColor());  // Set a random color
        }
    });

    

    { // Ground Plane
        const size = 200;

        const loader = new THREE.TextureLoader();
        const texture = loader.load('./ground.png');
        texture.encoding = THREE.sRGBEncoding;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.magFilter = THREE.NearestFilter;
        const repeats = size / 40;
        texture.repeat.set(repeats, repeats);

        const planeGeo = new THREE.PlaneGeometry(size, size);
        const planeMat = new THREE.MeshPhongMaterial({
        map: texture,
        side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(planeGeo, planeMat);
        mesh.receiveShadow = true;
        mesh.rotation.x = Math.PI * -.5;
        scene.add(mesh);
    }
    
    // Skybox 
    const skyboxLoader = new THREE.CubeTextureLoader();
    scene.background = skyboxLoader.load([
        './skybox/wall1.png', './skybox/wall2.png',
        './skybox/ceiling.png', './skybox/ground.png',
        './skybox/wall3.png', './skybox/wall4.png',
    ]);
    
    
    // Lights
    { // Greenish Ambient Light (Lower intensity)
        const color = 0xDAFCD7;
        const intensity = 0.03;  // Reduce intensity of ambient light
        const light = new THREE.AmbientLight(color, intensity);
        scene.add(light);
    }
    
    { // Directional Light (Adjusted position and shadow settings)
        const color = 0xFFFFFF;
        const intensity = 1;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(30, 30, 30);  // Position light further away
        light.target.position.set(0, 0, 0); // Target the penguin (or center)
        light.castShadow = true;
        
        // Shadow adjustments
        light.shadow.mapSize.width = 2048;  // High resolution shadows
        light.shadow.mapSize.height = 2048;
        light.shadow.bias = -0.001;  // Reduce shadow flickering
        light.shadow.camera.near = 0.1; // Set near clip plane for better shadow precision
        light.shadow.camera.far = 50;   // Set far clip plane for shadow rendering
    
        scene.add(light);
        scene.add(light.target);
    }
    
    { // Point Light (Adjust distance from penguin)
        const pointLight = new THREE.PointLight(0xffffff, 1, 100);
        pointLight.position.set(30, 20, 30);  // Move the point light further
        pointLight.castShadow = true; // Ensure the point light casts shadows
        pointLight.shadow.mapSize.width = 1024;  // Point light shadow resolution
        pointLight.shadow.mapSize.height = 1024;
        scene.add(pointLight);
    }
    
    // Function to generate a random color
    function randomColor() {
        return new THREE.Color(Math.random(), Math.random(), Math.random());
    }

    // Function to generate random positions within a given range
    function randomPosition() {
        const x = Math.random() * 100 - 50; // Random x position within [-50, 50]
        const z = Math.random() * 100 - 50; // Random z position within [-50, 50]
        return new THREE.Vector3(x, 1.5, z); // Keep y fixed at 1.5 to match ground plane height
    }

    // Add 20 primary shapes (cubes, spheres, cylinders)
    const shapeMaterial = new THREE.MeshPhongMaterial(); // We'll set color per shape

    // 10 Cubes
    for (let i = 0; i < 10; i++) {
        const cube = new THREE.Mesh(
            new THREE.BoxGeometry(3, 3, 3),
            new THREE.MeshPhongMaterial({ color: randomColor() })  // Random color for each cube
        );
        cube.position.copy(randomPosition());  // Set random position
        cube.castShadow = true;
        cube.receiveShadow = true;
        scene.add(cube);
    }

    // 5 Spheres
    for (let i = 0; i < 5; i++) {
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(2, 32, 32),
            new THREE.MeshPhongMaterial({ color: randomColor() })  // Random color for each sphere
        );
        sphere.position.copy(randomPosition());  // Set random position
        sphere.castShadow = true;
        sphere.receiveShadow = true;
        scene.add(sphere);
    }

    // 5 Cylinders
    for (let i = 0; i < 5; i++) {
        const cylinder = new THREE.Mesh(
            new THREE.CylinderGeometry(2, 2, 5, 32),
            new THREE.MeshPhongMaterial({ color: randomColor() })  // Random color for each cylinder
        );
        cylinder.position.copy(randomPosition());  // Set random position
        cylinder.castShadow = true;
        cylinder.receiveShadow = true;
        scene.add(cylinder);
    }
    
    // Load Penguin Model
    let penguinGroup;  // Variable to store the penguin group

    {
        const objLoader = new OBJLoader();
        const mtlLoader = new MTLLoader();
        mtlLoader.setMaterialOptions({ ignoreZeroRGBs: true });
        mtlLoader.load('./penguin/penguin.mtl', (mtl) => {
            mtl.preload();
            objLoader.setMaterials(mtl);
            objLoader.load('./penguin/penguin.obj', (group) => { // 'group' is the loaded object
                console.log(group); // Log the group to see the structure

                // Store the penguin group to rotate it and its children together
                penguinGroup = group;

                // Rotate the penguin to face forward
                penguinGroup.rotation.y = Math.PI / 2; // Rotate 90 degrees to the right (so penguin faces the camera)

                // Iterate over the group children to find meshes
                group.traverse((child) => {
                    if (child.isMesh) {
                        child.scale.set(4, 4, 4);
                        child.position.set(0, 0.4, 4);
                        child.castShadow = true;
                        child.userData.rotates = true; // Enable animation
                        child.userData.rotationSpeed = 0.02; // Speed of rotation
                    }
                });

                // Move penguin to a better location (further from the light)
                penguinGroup.position.set(0, 0.4, -20);  // Move penguin further back along the Z-axis

                // Add the entire group (which contains the mesh) to the scene
                scene.add(group);
            });
        });
    }

    // Load Penguin Hat
    {
        const objLoader = new OBJLoader();
        const mtlLoader = new MTLLoader();
        mtlLoader.setMaterialOptions({ ignoreZeroRGBs: true });
        mtlLoader.load('./hat/hat.mtl', (mtl) => {
            mtl.preload();
            objLoader.setMaterials(mtl);
            objLoader.load('./hat/hat.obj', (hat) => {
                // Scale and position the hat relative to the penguin (you can adjust this based on your preference)
                hat.scale.set(1.5, 1.5, 1.5);
                hat.position.set(-2, 13.5, 4);  // Adjust the Y-position to sit nicely on the penguin's head

                // If the penguin group is loaded, add the hat as its child
                if (penguinGroup) {
                    penguinGroup.add(hat); // Attach the hat to the penguin
                }
            });
        });
    }

    // Waddle and Feet Lift Animation
    let waddleTime = 0;  // Variable to control the waddling movement
    let waddleDirection = 1;  // Control direction (1 = right, -1 = left)
    let waddleSpeed = 0.015;  // Slower speed of waddling (slowed further)
    let waddleRange = 2;  // How far the penguin will sway to the side
    let bodyTiltAmount = 0.2;  // Body tilt for each waddle cycle
    let feetLiftAmount = 0.5;  // Feet lifting amount (up and down)

    function animate(time) {
        requestAnimationFrame(animate);

        // Convert time to seconds for smoother animations
        time *= 0.001;

        // Waddle effect: move penguin side to side and tilt body
        if (penguinGroup) {
            waddleTime += waddleSpeed * waddleDirection;  // Move the penguin in the current direction

            // If the penguin reaches the maximum range (right or left), reverse direction
            if (waddleTime >= waddleRange || waddleTime <= -waddleRange) {
                waddleDirection *= -1;  // Reverse direction
            }

            // Apply the sway movement along the x-axis (now that penguin is facing forward)
            penguinGroup.position.x = waddleTime;  // This gives a more controlled sway

            // Apply body tilt to simulate waddling (leaning from side to side)
            penguinGroup.rotation.z = Math.sin(waddleTime * Math.PI) * bodyTiltAmount;

            // Animate the feet by using a sine wave for up-and-down movement (for lift effect)
            if (penguinGroup) {
                penguinGroup.traverse((child) => {
                    if (child.name.includes('leg')) {  // Assuming 'leg' in the name for feet
                        child.position.y = Math.sin(time * 1.5) * feetLiftAmount; // Slower feet lift
                    }
                });
            }
        }

        controls.update();
        renderer.render(scene, camera);
    }
    animate();


}

main();
