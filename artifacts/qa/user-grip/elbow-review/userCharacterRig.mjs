import * as T from 'three';
export const USER_BONE_NAMES = ['pelvis', 'spine', 'chest', 'neck', 'head', 'leftUpperArm', 'leftForeArm', 'leftHand', 'rightUpperArm', 'rightForeArm', 'rightHand', 'leftThigh', 'leftShin', 'leftFoot', 'rightThigh', 'rightShin', 'rightFoot'];
/** Hand-fitted to the supplied mesh's measured, asymmetrical one-handed chopping bind pose.
 * Coordinates are the existing model's normalized space: feet at zero, face +Z.
 * These are adapter landmarks, not claims that the original FBX contained a rig. */
const JOINTS = {
    pelvis: { parent: null, point: [.16, .93, -.27], end: [.15, 1.12, -.23], radius: .22 },
    spine: { parent: 'pelvis', point: [.15, 1.12, -.23], end: [.14, 1.40, -.13], radius: .24 },
    chest: { parent: 'spine', point: [.14, 1.40, -.13], end: [.12, 1.56, .12], radius: .24 },
    neck: { parent: 'chest', point: [.12, 1.56, .12], end: [.105, 1.635, .18], radius: .10 },
    head: { parent: 'neck', point: [.08, 1.76, .25], end: [.08, 1.98, .25], radius: .255 },
    leftUpperArm: { parent: 'chest', point: [.39, 1.48, -.19], end: [.54, 1.25, -.27], radius: .125 },
    leftForeArm: { parent: 'leftUpperArm', point: [.54, 1.25, -.27], end: [.55, 1.03, -.05], radius: .115 },
    leftHand: { parent: 'leftForeArm', point: [.55, 1.03, -.05], end: [.55, .89, -.04], radius: .105 },
    rightUpperArm: { parent: 'chest', point: [-.12, 1.40, -.13], end: [-.11, 1.02, .04], radius: .125 },
    rightForeArm: { parent: 'rightUpperArm', point: [-.11, 1.02, .04], end: [.02, .70, .18], radius: .11 },
    rightHand: { parent: 'rightForeArm', point: [.02, .70, .18], end: [.105, .56, .20], radius: .10 },
    leftThigh: { parent: 'pelvis', point: [.32, .86, -.28], end: [.48, .48, -.20], radius: .15 },
    leftShin: { parent: 'leftThigh', point: [.48, .48, -.20], end: [.64, .19, -.43], radius: .135 },
    leftFoot: { parent: 'leftShin', point: [.64, .19, -.43], end: [.67, .10, -.20], radius: .135 },
    rightThigh: { parent: 'pelvis', point: [0, .86, -.21], end: [-.13, .51, .08], radius: .155 },
    rightShin: { parent: 'rightThigh', point: [-.13, .51, .08], end: [-.14, .16, -.03], radius: .14 },
    rightFoot: { parent: 'rightShin', point: [-.14, .16, -.03], end: [-.15, .08, .20], radius: .13 },
};
const Y = new T.Vector3(0, 1, 0);
function vector(value) { return new T.Vector3(...value); }
/** Discover the real disconnected axe rather than replacing it with a procedural prop. */
function axeCorners(geometry) {
    const positions = geometry.getAttribute('position'), parents = [], welded = new Map(), ids = [];
    const find = (value) => { let current = value; while (parents[current] !== current)
        current = parents[current]; while (parents[value] !== value) {
        const next = parents[value];
        parents[value] = current;
        value = next;
    } return current; };
    for (let i = 0; i < positions.count; i++) {
        const key = `${positions.getX(i).toFixed(5)}/${positions.getY(i).toFixed(5)}/${positions.getZ(i).toFixed(5)}`;
        let id = welded.get(key);
        if (id === undefined) {
            id = parents.length;
            parents.push(id);
            welded.set(key, id);
        }
        ids.push(id);
    }
    for (let i = 0; i < ids.length; i += 3) {
        const a = find(ids[i]);
        parents[find(ids[i + 1])] = a;
        parents[find(ids[i + 2])] = a;
    }
    const components = new Map();
    for (let i = 0; i < ids.length; i += 3) {
        const id = find(ids[i]), corners = components.get(id) ?? [];
        corners.push(i, i + 1, i + 2);
        components.set(id, corners);
    }
    const candidates = [...components.values()].filter(corners => {
        if (corners.length < 300)
            return false;
        const bounds = new T.Box3();
        for (const corner of corners)
            bounds.expandByPoint(new T.Vector3().fromBufferAttribute(positions, corner));
        const size = bounds.getSize(new T.Vector3());
        return size.z > 1.8 && size.x < .25 && bounds.max.y < 1.2 && bounds.min.y < .15;
    });
    if (candidates.length !== 1)
        throw new Error('用户人物斧头的实际连通网格不匹配，不能安全绑定');
    return new Set(candidates[0]);
}
function subset(source, corners) {
    const geometry = new T.BufferGeometry();
    for (const [name, attribute] of Object.entries(source.attributes)) {
        const values = [];
        for (const corner of corners)
            for (let i = 0; i < attribute.itemSize; i++)
                values.push(attribute.getComponent(corner, i));
        geometry.setAttribute(name, new T.Float32BufferAttribute(values, attribute.itemSize, attribute.normalized));
    }
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return geometry;
}
/** Distances travel along the actual surface, never across the air gap between
 * the freely hanging hand and the front knee in the supplied binding pose. */
function surfaceDistances(points, neighbors, line, name) {
    const distances = new Float64Array(points.length).fill(Infinity), heap = [];
    const push = (index, distance) => {
        const value = { index, distance };
        heap.push(value);
        let child = heap.length - 1;
        while (child > 0) {
            const parent = Math.floor((child - 1) / 2);
            if (heap[parent].distance <= distance)
                break;
            heap[child] = heap[parent];
            child = parent;
        }
        heap[child] = value;
    };
    const pop = () => {
        const first = heap[0], last = heap.pop();
        if (heap.length) {
            let parent = 0;
            heap[0] = last;
            while (true) {
                let child = parent * 2 + 1;
                if (child >= heap.length)
                    break;
                if (child + 1 < heap.length && heap[child + 1].distance < heap[child].distance)
                    child++;
                if (heap[child].distance >= last.distance)
                    break;
                heap[parent] = heap[child];
                parent = child;
            }
            heap[parent] = last;
        }
        return first;
    };
    for (const fraction of [.2, .5, .8]) {
        const seed = line.at(fraction, new T.Vector3());
        let index = -1, distance = Infinity;
        points.forEach((point, current) => {
            // The bent source's jaw passes in front of the upper chest capsule.
            // A chest seed belongs below that skin, on the actual upper garment.
            if (name === 'chest' && point.y > 1.52)
                return;
            const candidate = point.distanceTo(seed);
            if (candidate < distance) {
                distance = candidate;
                index = current;
            }
        });
        if (distance < distances[index]) {
            distances[index] = distance;
            push(index, distance);
        }
    }
    while (heap.length) {
        const current = pop();
        if (current.distance !== distances[current.index])
            continue;
        for (const neighbor of neighbors[current.index]) {
            const distance = current.distance + points[current.index].distanceTo(points[neighbor]);
            if (distance < distances[neighbor]) {
                distances[neighbor] = distance;
                push(neighbor, distance);
            }
        }
    }
    return distances;
}
/** Capsule assignment is smoothed over welded topology, never over UV islands or
 * spatially nearby hands/knees. This keeps nearby disconnected anatomy distinct. */
function bindWeights(geometry) {
    const positions = geometry.getAttribute('position'), unique = new Map(), ids = [], points = [], neighbors = [];
    for (let i = 0; i < positions.count; i++) {
        const point = new T.Vector3().fromBufferAttribute(positions, i), key = point.toArray().map(value => value.toFixed(5)).join('/');
        let id = unique.get(key);
        if (id === undefined) {
            id = points.length;
            unique.set(key, id);
            points.push(point);
            neighbors.push(new Set());
        }
        ids.push(id);
    }
    for (let i = 0; i < ids.length; i += 3)
        for (let j = 0; j < 3; j++) {
            const a = ids[i + j], b = ids[i + (j + 1) % 3];
            if (a !== b) {
                neighbors[a].add(b);
                neighbors[b].add(a);
            }
        }
    const lines = USER_BONE_NAMES.map(name => ({ name, line: new T.Line3(vector(JOINTS[name].point), vector(JOINTS[name].end)), radius: JOINTS[name].radius })), closest = new T.Vector3();
    const surfaces = lines.map(({ line, name }) => surfaceDistances(points, neighbors, line, name));
    let values = points.map((point, id) => {
        const candidates = lines.map(({ name, line, radius }, index) => {
            const distance = Number.isFinite(surfaces[index][id]) ? surfaces[index][id] : line.closestPointToPoint(point, true, closest).distanceTo(point);
            let normalized = distance / radius;
            // The chin reaches below the crown; keep the face/hair rigid rather than
            // averaging it into the shoulder just because its bind pose leans forward.
            if (name === 'head' && point.y > 1.42 && point.z > .16 && point.x < .34)
                normalized *= .35;
            if (name !== 'head' && point.y > 1.68)
                normalized += 5;
            if ((name.startsWith('left') || name.startsWith('right')) && point.y > 1.62)
                normalized += 3;
            return { index, distance: normalized };
        }).sort((a, b) => a.distance - b.distance);
        const result = new Float64Array(USER_BONE_NAMES.length), first = candidates[0], next = candidates[1];
        // Dominant bone away from a joint; permit a modest adjacent overlap. The
        // topology pass below makes joint transitions without cross-limb leakage.
        const second = next.distance - first.distance < .28 ? .18 : 0;
        result[first.index] = 1 - second;
        result[next.index] = second;
        return result;
    });
    for (let pass = 0; pass < 4; pass++)
        values = values.map((weights, id) => {
            const point = points[id];
            if (point.y > 1.63)
                return weights;
            const result = new Float64Array(weights.length);
            for (let i = 0; i < weights.length; i++)
                result[i] = weights[i] * .55;
            const share = .45 / Math.max(1, neighbors[id].size);
            for (const neighbor of neighbors[id])
                for (let i = 0; i < weights.length; i++)
                    result[i] += values[neighbor][i] * share;
            return result;
        });
    // Surface proximity alone lets a short hand capsule reach backwards through
    // the inside of a bent elbow. Partition each established arm chain by smooth
    // surface distances, and confine hand support to the measured wrist region.
    // Keep its total share unchanged so the shoulder still blends with the torso.
    for (const side of ['left', 'right']) {
        const upperIndex = USER_BONE_NAMES.indexOf(`${side}UpperArm`), foreIndex = USER_BONE_NAMES.indexOf(`${side}ForeArm`), handIndex = USER_BONE_NAMES.indexOf(`${side}Hand`), forearmDefinition = JOINTS[`${side}ForeArm`], forearm = new T.Line3(vector(forearmDefinition.point), vector(forearmDefinition.end));
        for (let id = 0; id < points.length; id++) {
            const weights = values[id], chain = weights[upperIndex] + weights[foreIndex] + weights[handIndex];
            if (chain <= .35)
                continue;
            const upperDistance = surfaces[upperIndex][id], foreDistance = surfaces[foreIndex][id];
            if (!Number.isFinite(upperDistance) || !Number.isFinite(foreDistance))
                continue;
            const position = forearm.closestPointToPointParameter(points[id], false), radial = forearm.closestPointToPoint(points[id], true, closest).distanceTo(points[id]), locality = 1 - T.MathUtils.smoothstep(radial, forearmDefinition.radius * .5, forearmDefinition.radius * 3);
            const elbow = T.MathUtils.lerp(T.MathUtils.smoothstep(upperDistance - foreDistance, -.28, .28), T.MathUtils.smoothstep(position, -.35, .35), locality), wrist = T.MathUtils.smoothstep(position, .65, 1.2), blend = T.MathUtils.smoothstep(chain, .35, .75);
            weights[upperIndex] = T.MathUtils.lerp(weights[upperIndex], chain * (1 - elbow), blend);
            weights[foreIndex] = T.MathUtils.lerp(weights[foreIndex], chain * elbow * (1 - wrist), blend);
            weights[handIndex] = T.MathUtils.lerp(weights[handIndex], chain * elbow * wrist, blend);
        }
    }
    // The source has separate leather pouches/buckle, shoulder strap and hair
    // tips. Their attachments follow anatomy, not proximity to a hanging hand.
    const seen = new Set();
    for (let id = 0; id < points.length; id++) {
        if (seen.has(id))
            continue;
        const stack = [id], component = [];
        seen.add(id);
        while (stack.length) {
            const current = stack.pop();
            component.push(current);
            for (const neighbor of neighbors[current])
                if (!seen.has(neighbor)) {
                    seen.add(neighbor);
                    stack.push(neighbor);
                }
        }
        if (component.length > 150)
            continue;
        const bounds = new T.Box3().setFromPoints(component.map(index => points[index]));
        for (const index of component) {
            const weights = new Float64Array(USER_BONE_NAMES.length);
            if (bounds.min.y > 1.9)
                weights[USER_BONE_NAMES.indexOf('head')] = 1;
            else if (bounds.min.y > .9 && bounds.max.y < 1.23)
                weights[USER_BONE_NAMES.indexOf('pelvis')] = 1;
            else if (bounds.min.y > 1 && bounds.max.y > 1.5) {
                const blend = T.MathUtils.smoothstep(points[index].y, 1.12, 1.42);
                weights[USER_BONE_NAMES.indexOf('spine')] = 1 - blend;
                weights[USER_BONE_NAMES.indexOf('chest')] = blend;
            }
            else
                continue;
            values[index] = weights;
        }
    }
    // Keep the measured neck/head surface above the garment's cervical opening
    // on its own chain. The forward-bent jaw is close to the chest in space but
    // must not inherit its much broader capsule, including after smoothing.
    const neckIndex = USER_BONE_NAMES.indexOf('neck'), headIndex = USER_BONE_NAMES.indexOf('head');
    for (let id = 0; id < points.length; id++) {
        const point = points[id];
        if (!(point.y > 1.56 && point.z > .025 && point.x > -.22 && point.x < .34))
            continue;
        const weights = values[id], neck = weights[neckIndex], head = weights[headIndex], sum = neck + head;
        weights.fill(0);
        if (sum > .000001) {
            weights[neckIndex] = neck / sum;
            weights[headIndex] = head / sum;
        }
        else
            weights[headIndex] = 1;
    }
    // A boot's sole is a rigid contact patch. Blend only above the ankle, so
    // counter-rotating a foot during IK cannot melt or curl the planted shoe.
    for (let id = 0; id < points.length; id++) {
        const point = points[id], left = point.x > .3, rigidHeight = left ? .21 : .17, blendTop = left ? .33 : .29;
        if (point.y >= blendTop)
            continue;
        const blend = 1 - T.MathUtils.smoothstep(point.y, rigidHeight, blendTop), weights = values[id];
        for (let index = 0; index < weights.length; index++)
            weights[index] *= 1 - blend;
        weights[USER_BONE_NAMES.indexOf(left ? 'leftFoot' : 'rightFoot')] += blend;
    }
    const indices = [], weights = [];
    for (const id of ids) {
        const influences = Array.from(values[id], (weight, index) => ({ weight, index })).sort((a, b) => b.weight - a.weight).slice(0, 4), sum = influences.reduce((total, value) => total + value.weight, 0);
        for (const influence of influences) {
            indices.push(influence.index);
            weights.push(influence.weight / sum);
        }
    }
    geometry.setAttribute('skinIndex', new T.Uint16BufferAttribute(indices, 4));
    geometry.setAttribute('skinWeight', new T.Float32BufferAttribute(weights, 4));
}
/** Derive local runtime skinning on the supplied unchanged FBX and own the adapter
 * allocations separately. The original source is still a static, unrigged file. */
export function createUserCharacterRig(model) {
    if (model.kind !== 'character')
        throw new Error('User character rig requires a character 人物 model');
    const root = model.root, meshes = [];
    root.traverse(object => { if (object instanceof T.Mesh)
        meshes.push(object); });
    if (meshes.length !== 1 || meshes[0] instanceof T.SkinnedMesh)
        throw new Error('用户人物绑定仅支持当前单网格静态原件');
    const source = meshes[0];
    root.updateWorldMatrix(true, true);
    const normalized = source.geometry.index ? source.geometry.toNonIndexed() : source.geometry.clone();
    normalized.applyMatrix4(root.matrixWorld.clone().invert().multiply(source.matrixWorld));
    let bodyGeometry, axeGeometry;
    try {
        const axeSet = axeCorners(normalized), bodySourceCorners = [], axeSourceCorners = [];
        for (let i = 0; i < normalized.getAttribute('position').count; i++)
            (axeSet.has(i) ? axeSourceCorners : bodySourceCorners).push(i);
        bodyGeometry = subset(normalized, bodySourceCorners);
        axeGeometry = subset(normalized, axeSourceCorners);
        bindWeights(bodyGeometry);
        const bones = {}, rest = {}, worldRotations = {};
        for (const name of USER_BONE_NAMES) {
            // Neck skin uses a shorter capsule, while its animation basis must still
            // point exactly towards the head pivot like all other nonterminal joints.
            const definition = JOINTS[name], bone = new T.Bone(), point = vector(definition.point), basisEnd = name === 'neck' ? JOINTS.head.point : definition.end, worldRotation = new T.Quaternion().setFromUnitVectors(Y, vector(basisEnd).sub(point).normalize());
            bone.name = `user-${name}`;
            worldRotations[name] = worldRotation;
            const parent = definition.parent ? bones[definition.parent] : root, parentRotation = definition.parent ? worldRotations[definition.parent] : new T.Quaternion(), parentPoint = definition.parent ? vector(JOINTS[definition.parent].point) : new T.Vector3();
            bone.position.copy(point).sub(parentPoint).applyQuaternion(parentRotation.clone().invert());
            bone.quaternion.copy(parentRotation.clone().invert().multiply(worldRotation));
            parent.add(bone);
            bones[name] = bone;
            rest[name] = { position: bone.position.clone(), quaternion: bone.quaternion.clone(), worldPosition: point, worldQuaternion: worldRotation.clone() };
        }
        const mesh = new T.SkinnedMesh(bodyGeometry, source.material);
        mesh.name = 'user-derived-skinned-body';
        mesh.castShadow = true;
        mesh.receiveShadow = false;
        mesh.frustumCulled = false;
        root.add(mesh);
        root.updateMatrixWorld(true);
        const skeleton = new T.Skeleton(USER_BONE_NAMES.map(name => bones[name]));
        mesh.bind(skeleton);
        skeleton.update();
        const axeRoot = new T.Group();
        axeRoot.name = 'user-rigid-source-axe';
        const butt = new T.Vector3(.479785, 1.025035, -.472051), direction = new T.Vector3(.010667, -.289890, .957).normalize();
        axeRoot.position.copy(butt);
        axeRoot.quaternion.setFromUnitVectors(Y, direction);
        const axeMatrix = new T.Matrix4().compose(axeRoot.position, axeRoot.quaternion, axeRoot.scale);
        axeGeometry.applyMatrix4(axeMatrix.clone().invert());
        const axeMesh = new T.Mesh(axeGeometry, source.material);
        axeMesh.name = 'user-source-axe-mesh';
        axeMesh.castShadow = true;
        axeRoot.add(axeMesh);
        root.add(axeRoot);
        const axe = { root: axeRoot, mesh: axeMesh, grips: { lower: new T.Vector3(0, .20, 0), upper: new T.Vector3(0, .55, 0) }, blade: new T.Vector3(.58433, .09255, 1.56338).applyMatrix4(axeMatrix.clone().invert()), rest: { position: axeRoot.position.clone(), quaternion: axeRoot.quaternion.clone() } };
        const localPalm = (name, point) => vector(point).sub(rest[name].worldPosition).applyQuaternion(rest[name].worldQuaternion.clone().invert());
        const palms = { left: localPalm('leftHand', [.55, .89, -.04]), right: localPalm('rightHand', [.105, .56, .20]) };
        source.visible = false;
        root.updateMatrixWorld(true);
        let disposed = false;
        return { root, motionSupport: 'derived-skeleton', mesh, skeleton, bones, rest, palms, axe, bodySourceCorners, axeSourceCorners,
            resetPose() { for (const name of USER_BONE_NAMES) {
                bones[name].position.copy(rest[name].position);
                bones[name].quaternion.copy(rest[name].quaternion);
            } axeRoot.position.copy(axe.rest.position); axeRoot.quaternion.copy(axe.rest.quaternion); root.updateMatrixWorld(true); skeleton.update(); },
            dispose() { if (disposed)
                return; disposed = true; bodyGeometry.dispose(); axeGeometry.dispose(); skeleton.dispose(); model.dispose(); },
        };
    }
    catch (error) {
        bodyGeometry?.dispose();
        axeGeometry?.dispose();
        throw error;
    }
    finally {
        normalized.dispose();
    }
}
