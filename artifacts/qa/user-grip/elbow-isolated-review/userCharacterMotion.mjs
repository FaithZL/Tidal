import * as T from 'three';
const Y = new T.Vector3(0, 1, 0);
const smooth = (value) => { const x = T.MathUtils.clamp(value, 0, 1); return x * x * x * (x * (x * 6 - 15) + 10); };
const pose = (grip, axis, straighten, twist, hip) => ({ grip: new T.Vector3(...grip), axis: new T.Vector3(...axis).normalize(), straighten, twist, hip });
const IDLE = pose([.39, 1.13, -.08], [0, -.76, .65], -.48, 0, .055);
const RAISED = pose([.29, 1.96, -.13], [0, .78, -.63], -.56, -.14, .055);
const IMPACT = pose([.44, 1.015, .14], [.02, -.45, .893], -.16, .10, .035);
const FOLLOW = pose([.44, 1.025, .13], [.02, -.49, .87], -.14, .12, .033);
/** Presentation-only clip for this supplied character. It never produces input
 * signals. Two-bone IK preserves limb lengths; sole targets stay in rig space.
 * The original oversized tool is a constant 62% display adaptation, not skinning. */
export class UserCharacterMotion {
    rig;
    constructor(rig) {
        this.rig = rig;
        rig.axe.root.scale.setScalar(.62);
    }
    sample(timeSec, idleOnly = false) {
        const time = Number.isFinite(timeSec) ? Math.max(0, timeSec) : 0, t = time % 7.1;
        let a = IDLE, b = IDLE, blend = 0, phase = 'idle';
        if (!idleOnly) {
            if (t >= 2.4 && t < 3.35) {
                b = RAISED;
                blend = smooth((t - 2.4) / .95);
                phase = 'prepare';
            }
            else if (t >= 3.35 && t < 3.65) {
                a = b = RAISED;
                phase = 'prepare';
            }
            else if (t >= 3.65 && t < 4.15) {
                a = RAISED;
                b = IMPACT;
                blend = smooth((t - 3.65) / .5);
                phase = 'strike';
            }
            else if (t >= 4.15 && t < 4.4) {
                a = IMPACT;
                b = FOLLOW;
                blend = smooth((t - 4.15) / .25);
                phase = 'recover';
            }
            else if (t >= 4.4 && t < 5.6) {
                a = FOLLOW;
                b = IDLE;
                blend = smooth((t - 4.4) / 1.2);
                phase = 'recover';
            }
        }
        const rig = this.rig, breath = Math.sin(t / 7.1 * Math.PI * 2) * .006;
        rig.root.updateWorldMatrix(true, true);
        rig.resetPose();
        const straighten = T.MathUtils.lerp(a.straighten, b.straighten, blend), twist = T.MathUtils.lerp(a.twist, b.twist, blend);
        rig.bones.pelvis.position.y += T.MathUtils.lerp(a.hip, b.hip, blend) + breath * .35;
        rig.bones.pelvis.position.z -= .025;
        // Additive rotations use character space, not an assumed exporter bone axis.
        this.rotate('pelvis', -.035, twist * .15);
        this.rotate('spine', straighten * .6 + breath, twist * .40);
        this.rotate('chest', straighten * .4, twist * .45);
        this.rotate('neck', -.08, 0);
        this.rotate('head', -.025, -twist * .25);
        rig.root.updateMatrixWorld(true);
        const rootRotation = rig.root.getWorldQuaternion(new T.Quaternion()), rootScale = rig.root.getWorldScale(new T.Vector3());
        for (const side of ['left', 'right']) {
            const foot = side === 'left' ? 'leftFoot' : 'rightFoot';
            const target = rig.root.localToWorld(rig.rest[foot].worldPosition.clone());
            this.solve(side === 'left' ? 'leftThigh' : 'rightThigh', side === 'left' ? 'leftShin' : 'rightShin', foot, target, rig.root.localToWorld(new T.Vector3(side === 'left' ? .5 : -.15, .5, .65)));
            this.worldRotation(foot, rootRotation.clone().multiply(rig.rest[foot].worldQuaternion));
        }
        const orientationA = new T.Quaternion().setFromUnitVectors(Y, a.axis), orientationB = new T.Quaternion().setFromUnitVectors(Y, b.axis);
        // A modest shaft roll exposes the source blade without changing its shape.
        const toolRotation = orientationA.slerp(orientationB, blend).multiply(new T.Quaternion().setFromAxisAngle(Y, .35)), grip = a.grip.clone().lerp(b.grip, blend);
        grip.y += breath;
        rig.axe.root.quaternion.copy(toolRotation);
        rig.axe.root.position.copy(grip).sub(rig.axe.grips.upper.clone().multiply(rig.axe.root.scale).applyQuaternion(toolRotation));
        rig.root.updateMatrixWorld(true);
        const toolDelta = toolRotation.clone().multiply(rig.axe.rest.quaternion.clone().invert());
        for (const side of ['left', 'right']) {
            const hand = side === 'left' ? 'leftHand' : 'rightHand';
            const handRotation = rootRotation.clone().multiply(toolDelta).multiply(rig.rest[hand].worldQuaternion);
            const target = rig.axe.root.localToWorld((side === 'left' ? rig.axe.grips.upper : rig.axe.grips.lower).clone());
            target.sub(rig.palms[side].clone().multiply(rootScale).applyQuaternion(handRotation));
            const pole = rig.root.localToWorld(new T.Vector3(side === 'left' ? 1.2 : -.8, 1.1, .35));
            this.solve(side === 'left' ? 'leftUpperArm' : 'rightUpperArm', side === 'left' ? 'leftForeArm' : 'rightForeArm', hand, target, pole);
            this.worldRotation(hand, handRotation);
        }
        rig.root.updateMatrixWorld(true);
        rig.skeleton.update();
        return { phase };
    }
    rotate(name, x, y) {
        const bone = this.rig.bones[name], localFrame = new T.Quaternion().setFromEuler(new T.Euler(x, y, 0));
        const parent = bone.parent instanceof T.Bone ? bone.parent : null;
        const parentName = parent ? Object.keys(this.rig.bones).find(key => this.rig.bones[key] === parent) : undefined;
        const basis = parentName ? this.rig.rest[parentName].worldQuaternion : new T.Quaternion();
        bone.quaternion.premultiply(basis.clone().invert().multiply(localFrame).multiply(basis));
    }
    worldRotation(name, rotation) {
        const bone = this.rig.bones[name], parentRotation = bone.parent.getWorldQuaternion(new T.Quaternion());
        bone.quaternion.copy(parentRotation.invert().multiply(rotation));
        bone.updateWorldMatrix(false, true);
    }
    aim(name, child, target) {
        const bone = this.rig.bones[name], start = bone.getWorldPosition(new T.Vector3());
        const current = this.rig.bones[child].getWorldPosition(new T.Vector3()).sub(start).normalize();
        const desired = target.clone().sub(start).normalize();
        this.worldRotation(name, new T.Quaternion().setFromUnitVectors(current, desired).multiply(bone.getWorldQuaternion(new T.Quaternion())));
    }
    solve(upper, middle, end, target, pole) {
        const bones = this.rig.bones, start = bones[upper].getWorldPosition(new T.Vector3());
        const middlePoint = bones[middle].getWorldPosition(new T.Vector3()), endPoint = bones[end].getWorldPosition(new T.Vector3());
        const lengthA = middlePoint.distanceTo(start), lengthB = endPoint.distanceTo(middlePoint);
        const direction = target.clone().sub(start), distance = T.MathUtils.clamp(direction.length(), Math.abs(lengthA - lengthB) + .000001, lengthA + lengthB - .000001);
        direction.normalize();
        const perpendicular = pole.clone().sub(start);
        perpendicular.addScaledVector(direction, -perpendicular.dot(direction)).normalize();
        const cosine = T.MathUtils.clamp((lengthA * lengthA + distance * distance - lengthB * lengthB) / (2 * lengthA * distance), -1, 1);
        const elbow = start.clone().addScaledVector(direction, lengthA * cosine).addScaledVector(perpendicular, lengthA * Math.sqrt(1 - cosine * cosine));
        this.aim(upper, middle, elbow);
        this.aim(middle, end, target);
    }
    bladePosition() { return this.rig.axe.root.localToWorld(this.rig.axe.blade.clone()); }
    handPosition(side) { return this.rig.bones[side === 'left' ? 'leftHand' : 'rightHand'].localToWorld(this.rig.palms[side].clone()); }
}
