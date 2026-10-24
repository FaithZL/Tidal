import * as T from 'three';
import { createUserHandGrip } from './userHandGrip.mjs';
const Y = new T.Vector3(0, 1, 0);
const smooth = (value) => { const x = T.MathUtils.clamp(value, 0, 1); return x * x * x * (x * (x * 6 - 15) + 10); };
const pose = (grip, axis, straighten, twist, hip) => ({ grip: new T.Vector3(...grip), axis: new T.Vector3(...axis).normalize(), straighten, twist, hip });
const IDLE = pose([.39, 1.13, -.08], [0, -.76, .65], -.48, 0, .055);
const RAISED = pose([.29, 1.96, -.13], [0, .78, -.63], -.56, -.14, .055);
const IMPACT = pose([.44, 1.015, .14], [.02, -.45, .893], -.16, .10, .035);
const FOLLOW = pose([.44, 1.025, .13], [.02, -.49, .87], -.14, .12, .033);
const CLEAR = pose([.43, 1.17, .10], [.01, -.60, .80], -.25, .065, .045);
const orientation = (value) => new T.Quaternion().setFromUnitVectors(Y, value.axis).multiply(new T.Quaternion().setFromAxisAngle(Y, .35));
/** Presentation-only clip for this supplied character. It never produces input
 * signals. Two-bone IK preserves limb lengths; sole targets stay in rig space.
 * The original oversized tool is a constant 62% display adaptation, not skinning. */
export class UserCharacterMotion {
    rig;
    impactBlade;
    idleBlade;
    hands;
    constructor(rig) {
        this.rig = rig;
        this.hands = createUserHandGrip(rig);
        rig.axe.root.scale.setScalar(.62);
        // A little space between the supplied bulky leather cuffs; the lower grasp
        // still leaves room for the fingers before the end of the actual shaft.
        rig.axe.grips.lower.y = .16;
        const bladeOffset = rig.axe.blade.clone().sub(rig.axe.grips.upper).multiply(rig.axe.root.scale);
        this.impactBlade = bladeOffset.clone().applyQuaternion(orientation(IMPACT)).add(IMPACT.grip);
        this.idleBlade = bladeOffset.clone().applyQuaternion(orientation(IDLE)).add(IDLE.grip);
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
            // The tool stops at contact; torso and head absorb it a little later.
            else if (t >= 3.65 && t < 4.27) {
                a = RAISED;
                b = FOLLOW;
                blend = smooth((t - 3.65) / .62);
                phase = t < 4.15 ? 'strike' : 'recover';
            }
            else if (t >= 4.27 && t < 4.4) {
                a = b = FOLLOW;
                phase = 'recover';
            }
            else if (t >= 4.4 && t < 4.7) {
                a = FOLLOW;
                b = CLEAR;
                blend = smooth((t - 4.4) / .3);
                phase = 'recover';
            }
            else if (t >= 4.7 && t < 5.6) {
                a = CLEAR;
                b = IDLE;
                blend = smooth((t - 4.7) / .9);
                phase = 'recover';
            }
        }
        const rig = this.rig, breath = Math.sin(t / 7.1 * Math.PI * 2) * .006 * ((a === IDLE ? 1 - blend : 0) + (b === IDLE ? blend : 0));
        const idleShare = (a === IDLE ? 1 - blend : 0) + (b === IDLE ? blend : 0);
        this.hands.apply(.88 + .12 * (1 - idleShare));
        rig.root.updateWorldMatrix(true, true);
        rig.resetPose();
        const straighten = T.MathUtils.lerp(a.straighten, b.straighten, blend), twist = T.MathUtils.lerp(a.twist, b.twist, blend);
        rig.bones.pelvis.position.y += T.MathUtils.lerp(a.hip, b.hip, blend) + breath * .35;
        rig.bones.pelvis.position.z -= .025;
        // Additive rotations use character space, not an assumed exporter bone axis.
        this.rotate('pelvis', -.035, twist * .15);
        this.rotate('spine', straighten * .6 + breath, twist * .40);
        this.rotate('chest', straighten * .4, twist * .45);
        const absorb = !idleOnly && t >= 4.15 && t < 4.4 ? Math.sin((t - 4.15) / .25 * Math.PI) ** 2 * .035 : 0;
        this.rotate('neck', -.08 + absorb * .35, 0);
        this.rotate('head', -.025 + absorb, -twist * .25);
        rig.root.updateMatrixWorld(true);
        const rootRotation = rig.root.getWorldQuaternion(new T.Quaternion()), rootScale = rig.root.getWorldScale(new T.Vector3());
        for (const side of ['left', 'right']) {
            const foot = side === 'left' ? 'leftFoot' : 'rightFoot';
            const target = rig.root.localToWorld(rig.rest[foot].worldPosition.clone());
            this.solve(side === 'left' ? 'leftThigh' : 'rightThigh', side === 'left' ? 'leftShin' : 'rightShin', foot, target, rig.root.localToWorld(new T.Vector3(side === 'left' ? .5 : -.15, .5, .65)));
            this.worldRotation(foot, rootRotation.clone().multiply(rig.rest[foot].worldQuaternion));
        }
        const { rotation: toolRotation, grip } = this.toolPose(t, idleOnly);
        rig.axe.root.quaternion.copy(toolRotation);
        rig.axe.root.position.copy(grip).sub(rig.axe.grips.upper.clone().multiply(rig.axe.root.scale).applyQuaternion(toolRotation));
        rig.root.updateMatrixWorld(true);
        for (const side of ['left', 'right']) {
            const hand = side === 'left' ? 'leftHand' : 'rightHand';
            const toolDelta = toolRotation.clone().multiply(this.hands.frames[side].clone().invert());
            const handRotation = rootRotation.clone().multiply(toolDelta).multiply(rig.rest[hand].worldQuaternion);
            const target = rig.axe.root.localToWorld((side === 'left' ? rig.axe.grips.upper : rig.axe.grips.lower).clone());
            target.sub(this.hands.centers[side].clone().multiply(rootScale).applyQuaternion(handRotation));
            const pole = rig.root.localToWorld(new T.Vector3(side === 'left' ? 1.2 : -.8, 1.1, .35));
            this.solve(side === 'left' ? 'leftUpperArm' : 'rightUpperArm', side === 'left' ? 'leftForeArm' : 'rightForeArm', hand, target, pole);
            this.worldRotation(hand, handRotation);
        }
        rig.root.updateMatrixWorld(true);
        rig.skeleton.update();
        return { phase };
    }
    toolPose(t, idleOnly) {
        if (!idleOnly && t >= 4.15 && t < 5.6) {
            let rotation = orientation(IMPACT), blade = this.impactBlade.clone();
            if (t < 4.4) {
                // Brief contact, tiny spring-back, then settle above the cut. The torso
                // continues its own follow-through without pushing the blade into wood.
                const rise = t < 4.2 ? 0 : t < 4.28 ? .028 * smooth((t - 4.2) / .08) : T.MathUtils.lerp(.028, .012, smooth((t - 4.28) / .12));
                blade.y += rise;
            }
            else if (t < 4.7) {
                const u = smooth((t - 4.4) / .3);
                blade.add(new T.Vector3(-.015 * u, T.MathUtils.lerp(.012, .15, u), -.035 * u));
                rotation.slerp(orientation(CLEAR), u);
            }
            else {
                const u = smooth((t - 4.7) / .9), start = this.impactBlade.clone().add(new T.Vector3(-.015, .15, -.035)), control = this.impactBlade.clone().add(new T.Vector3(-.18, .28, -.35));
                blade.copy(start).multiplyScalar((1 - u) * (1 - u)).addScaledVector(control, 2 * (1 - u) * u).addScaledVector(this.idleBlade, u * u);
                rotation = orientation(CLEAR).slerp(orientation(IDLE), u);
                blade.y += Math.sin(t / 7.1 * Math.PI * 2) * .006 * u;
            }
            return { rotation, grip: blade.sub(this.rig.axe.blade.clone().sub(this.rig.axe.grips.upper).multiply(this.rig.axe.root.scale).applyQuaternion(rotation)) };
        }
        let a = IDLE, b = IDLE, u = 0;
        if (!idleOnly && t >= 2.4 && t < 3.35) {
            b = RAISED;
            u = smooth((t - 2.4) / .95);
        }
        else if (!idleOnly && t >= 3.35 && t < 3.65) {
            a = b = RAISED;
        }
        else if (!idleOnly && t >= 3.65 && t < 4.15) {
            a = RAISED;
            b = IMPACT;
            const strike = (t - 3.65) / .5;
            u = strike * strike * (2 - strike);
        }
        const rotation = orientation(a).slerp(orientation(b), u), grip = a.grip.clone().lerp(b.grip, u);
        grip.y += Math.sin(t / 7.1 * Math.PI * 2) * .006 * ((a === IDLE ? 1 - u : 0) + (b === IDLE ? u : 0));
        return { rotation, grip };
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
    handPosition(side) { return this.rig.bones[side === 'left' ? 'leftHand' : 'rightHand'].localToWorld(this.hands.centers[side].clone()); }
}
