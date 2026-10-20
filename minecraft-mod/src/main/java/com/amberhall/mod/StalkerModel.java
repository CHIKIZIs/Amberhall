package com.amberhall.mod;

import net.minecraft.client.model.ModelData;
import net.minecraft.client.model.ModelPart;
import net.minecraft.client.model.ModelPartBuilder;
import net.minecraft.client.model.ModelPartData;
import net.minecraft.client.model.ModelTransform;
import net.minecraft.client.model.TexturedModelData;
import net.minecraft.client.render.entity.model.EntityModelLayer;
import net.minecraft.client.render.entity.model.SinglePartEntityModel;
import net.minecraft.util.math.MathHelper;

/** Модель сталкера. Части и текстура генерируются скриптом tools/stalker_gen.py (шаблон — tools/StalkerModel.java.tpl). */
public class StalkerModel extends SinglePartEntityModel<StalkerEntity> {
	public static final EntityModelLayer LAYER = new EntityModelLayer(AmberhallMod.id("stalker"), "main");

	private final ModelPart root;
	private final ModelPart body;
	private final ModelPart hump;
	private final ModelPart head;
	private final ModelPart hornL;
	private final ModelPart hornR;
	private final ModelPart armL;
	private final ModelPart armR;
	private final ModelPart legL;
	private final ModelPart legR;

	public StalkerModel(ModelPart root) {
		this.root = root;
		this.body = root.getChild("body");
		this.hump = this.body.getChild("hump");
		this.head = this.body.getChild("head");
		this.hornL = this.head.getChild("horn_l");
		this.hornR = this.head.getChild("horn_r");
		this.armL = this.body.getChild("arm_l");
		this.armR = this.body.getChild("arm_r");
		this.legL = root.getChild("leg_l");
		this.legR = root.getChild("leg_r");
	}

	public static TexturedModelData getTexturedModelData() {
		ModelData data = new ModelData();
		ModelPartData r = data.getRoot();
		ModelPartData bodyD = r.addChild("body", ModelPartBuilder.create().uv(56, 0).cuboid(-4F, -12F, -2F, 8F, 12F, 4F), ModelTransform.of(0F, 12F, 0F, 0.3F, 0F, 0F));
		ModelPartData humpD = bodyD.addChild("hump", ModelPartBuilder.create().uv(0, 21).cuboid(-3F, -6F, 0F, 6F, 6F, 3F), ModelTransform.of(0F, -3F, 2F, 0.1F, 0F, 0F));
		ModelPartData headD = bodyD.addChild("head", ModelPartBuilder.create().uv(24, 0).cuboid(-4F, -8F, -4F, 8F, 8F, 8F), ModelTransform.of(0F, -12F, -1F, -0.15F, 0F, 0F));
		ModelPartData hornLD = headD.addChild("horn_l", ModelPartBuilder.create().uv(18, 21).cuboid(-1F, -6F, -1F, 2F, 6F, 2F), ModelTransform.of(3F, -8F, -1F, -0.25F, 0F, 0.45F));
		ModelPartData hornRD = headD.addChild("horn_r", ModelPartBuilder.create().uv(26, 21).cuboid(-1F, -6F, -1F, 2F, 6F, 2F), ModelTransform.of(-3F, -8F, -1F, -0.25F, 0F, -0.45F));
		ModelPartData armLD = bodyD.addChild("arm_l", ModelPartBuilder.create().uv(0, 0).cuboid(-1.5F, 0F, -1.5F, 3F, 18F, 3F), ModelTransform.of(5.5F, -10F, 0F, 0.05F, 0F, -0.06F));
		ModelPartData armRD = bodyD.addChild("arm_r", ModelPartBuilder.create().uv(12, 0).cuboid(-1.5F, 0F, -1.5F, 3F, 18F, 3F), ModelTransform.of(-5.5F, -10F, 0F, 0.05F, 0F, 0.06F));
		ModelPartData legLD = r.addChild("leg_l", ModelPartBuilder.create().uv(80, 0).cuboid(-2F, 0F, -2F, 4F, 12F, 4F), ModelTransform.pivot(2.2F, 12F, 0F));
		ModelPartData legRD = r.addChild("leg_r", ModelPartBuilder.create().uv(96, 0).cuboid(-2F, 0F, -2F, 4F, 12F, 4F), ModelTransform.pivot(-2.2F, 12F, 0F));
		return TexturedModelData.of(data, 128, 64);
	}

	@Override
	public void setAngles(StalkerEntity e, float limbAngle, float limbDistance, float age, float headYaw, float headPitch) {
		this.root.traverse().forEach(ModelPart::resetTransform);
		head.yaw += headYaw * MathHelper.RADIANS_PER_DEGREE;
		head.pitch += headPitch * MathHelper.RADIANS_PER_DEGREE;

		// ходьба как у зомби: противофазный шаг ног и рук
		float swing = MathHelper.cos(limbAngle * 0.6662f) * 1.3f * limbDistance;
		legL.pitch = swing;
		legR.pitch = -swing;
		body.yaw += swing * 0.12f;
		head.yaw -= swing * 0.12f;
		body.pitch += MathHelper.sin(age * 0.09f) * 0.02f;

		if (e.isAttacking()) {
			// руки вперёд, как у зомби, но когтистые, и покачиваются
			float claw = MathHelper.sin(age * 0.6f) * 0.1f;
			armL.pitch = -1.4f + claw;
			armR.pitch = -1.4f - claw;
		} else {
			float sway = MathHelper.sin(age * 0.07f) * 0.04f;
			armL.pitch += -swing * 0.6f + sway;
			armR.pitch += swing * 0.6f - sway;
			armL.roll += 0.02f + MathHelper.sin(age * 0.09f) * 0.02f;
			armR.roll -= 0.02f + MathHelper.sin(age * 0.09f) * 0.02f;
		}
	}

	@Override
	public ModelPart getPart() {
		return root;
	}
}
