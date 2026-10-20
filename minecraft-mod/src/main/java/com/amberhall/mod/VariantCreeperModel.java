package com.amberhall.mod;

import net.minecraft.client.model.ModelPart;
import net.minecraft.client.render.entity.model.EntityModelLayer;
import net.minecraft.client.render.entity.model.SinglePartEntityModel;
import net.minecraft.util.math.MathHelper;

/** Анимация для всех биомных криперов (формы — CreeperVariantModels): голова, четыре ноги, у некоторых руки. */
public class VariantCreeperModel extends SinglePartEntityModel<VariantCreeperEntity> {
	private final ModelPart root, head, legBr, legBl, legFr, legFl;
	private final ModelPart armL, armR;

	public static EntityModelLayer layer(VariantType v) {
		return new EntityModelLayer(AmberhallMod.id(v.entityName()), "main");
	}

	public VariantCreeperModel(ModelPart root) {
		this.root = root;
		this.head = root.getChild("head");
		this.legBr = root.getChild("leg_br");
		this.legBl = root.getChild("leg_bl");
		this.legFr = root.getChild("leg_fr");
		this.legFl = root.getChild("leg_fl");
		ModelPart body = root.getChild("body");
		this.armL = body.hasChild("arm_l") ? body.getChild("arm_l") : null;
		this.armR = body.hasChild("arm_r") ? body.getChild("arm_r") : null;
	}

	@Override
	public void setAngles(VariantCreeperEntity e, float limbAngle, float limbDistance, float age, float headYaw, float headPitch) {
		this.root.traverse().forEach(ModelPart::resetTransform);
		this.head.yaw += headYaw * MathHelper.RADIANS_PER_DEGREE;
		this.head.pitch += headPitch * MathHelper.RADIANS_PER_DEGREE;
		// походка поверх сутулой стойки: лапы по диагонали
		float swing = MathHelper.cos(limbAngle * 0.6662f) * 1.0f * limbDistance;
		this.legBr.pitch += swing;
		this.legFl.pitch += swing;
		this.legBl.pitch -= swing;
		this.legFr.pitch -= swing;
		if (armL != null) {
			armL.pitch += -swing * 0.6f;
			armR.pitch += swing * 0.6f;
			armL.roll += MathHelper.sin(age * 0.07f) * 0.04f;
			armR.roll -= MathHelper.sin(age * 0.07f) * 0.04f;
		}
	}

	@Override
	public ModelPart getPart() {
		return root;
	}
}
