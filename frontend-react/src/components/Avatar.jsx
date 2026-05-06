import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";

function Avatar() {
  const mountRef = useRef(null);
  let mixer = null;
  let talkingAction = null;
  const clock = new THREE.Clock();

  useEffect(() => {
    const container = mountRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1e1f24);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000,
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;

      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    window.addEventListener("resize", handleResize);
    handleResize();
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // Load model
    let modelRef = null;
    const dracoLoader = new DRACOLoader();

    // 🔥 VERY IMPORTANT

    dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");

    const loader = new GLTFLoader();

    loader.setDRACOLoader(dracoLoader);
    loader.load("/models/Dr_ambedkar2.glb", (gltf) => {
      const model = gltf.scene;
      window.startTalking = () => {
        if (!talkingAction) return;
        talkingAction.stop();
        talkingAction.reset();
        talkingAction.fadeIn(0.2);
        talkingAction.play();
      };

      window.stopTalking = () => {
        if (!talkingAction) return;
        talkingAction.fadeOut(0.3);
      };
      modelRef = model;
      if (gltf.animations.length) {
        mixer = new THREE.AnimationMixer(model);

        const talkingClip = gltf.animations.find((c) =>
          c.name.includes("Anim.001"),
        );

        if (talkingClip) {
          talkingAction = mixer.clipAction(talkingClip);
          talkingAction.loop = THREE.LoopRepeat;
        }
      }
      window.avatarReady = true;

      model.scale.set(0.50, 0.50, 0.50);
      model.rotation.y = Math.PI / 2;

      // 🔥 Proper centering (same as your original working code)
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      // Center horizontally
      model.position.x = -center.x - size.x * 0.45;
      model.position.z = -center.z;

      // Ground the model (feet at y = 0)
      model.position.y = -box.min.y;

      scene.add(model);

      // 🔥 Proper camera positioning (dynamic)
      const fov = camera.fov * (Math.PI / 180);
      const distance = size.y / (2 * Math.tan(fov / 2));

      camera.position.set(0, size.y * 0.55, distance * 1.5);
      camera.lookAt(0, size.y * 0.5, 0);
    });

    const animate = () => {
      requestAnimationFrame(animate);

      // 🔊 Simple lip sync effect (scale animation when speaking)
      if (mixer) mixer.update(clock.getDelta());

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.startTalking = null;
      window.stopTalking = null;
      window.avatarReady = false;
      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        width: "100%",
        height: "100%",
        maxWidth: "500px",
      }}
    />
  );
}

export default Avatar;
