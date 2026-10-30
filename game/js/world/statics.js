// Scenery that never moves (v2.1 playtest SYS-01): three recomputes every object's matrices in every frame's
// matrix pass. A piece built where it stays (a place's merged surfaces, its instanced trees and light pools, its
// plaques) has them computed once here and is skipped by that pass from then on (three's matrixAutoUpdate and
// matrixWorldAutoUpdate). Its visibility, materials and instance matrices still change as before; only its own
// position, rotation and scale (and its parent's) must not: a piece that moves is never frozen.
export function freezeStatic(obj) {
  obj.updateMatrixWorld(true);
  obj.traverse((o) => {
    o.matrixAutoUpdate = false;
    o.matrixWorldAutoUpdate = false;
  });
  return obj;
}
