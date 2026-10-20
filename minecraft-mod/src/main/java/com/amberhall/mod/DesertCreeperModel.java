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

/** Модель пустынного крипера (обугленный колючий кактус). Части и текстура генерируются tools/desert_creeper_gen.py (шаблон — tools/DesertCreeperModel.java.tpl). */
public class DesertCreeperModel extends SinglePartEntityModel<DesertCreeperEntity> {
	public static final EntityModelLayer LAYER = new EntityModelLayer(AmberhallMod.id("desert_creeper"), "main");

	private final ModelPart root;
	private final ModelPart trunk;
	private final ModelPart armL;
	private final ModelPart armLUp;
	private final ModelPart footL;
	private final ModelPart armR;
	private final ModelPart armRUp;
	private final ModelPart footR;

	public DesertCreeperModel(ModelPart root) {
		this.root = root;
		this.trunk = root.getChild("trunk");
		this.armL = this.trunk.getChild("arm_l");
		this.armLUp = this.armL.getChild("arm_l_up");
		this.footL = root.getChild("foot_l");
		this.armR = this.trunk.getChild("arm_r");
		this.armRUp = this.armR.getChild("arm_r_up");
		this.footR = root.getChild("foot_r");
	}

	public static TexturedModelData getTexturedModelData() {
		ModelData data = new ModelData();
		ModelPartData r = data.getRoot();
		ModelPartData trunkD = r.addChild("trunk", ModelPartBuilder.create().uv(0, 0).cuboid(-3F, -16F, -3F, 6F, 16F, 6F), ModelTransform.pivot(0F, 22F, 0F));
		ModelPartData armLD = trunkD.addChild("arm_l", ModelPartBuilder.create().uv(16, 22).cuboid(0F, -1.5F, -1.5F, 3F, 3F, 3F), ModelTransform.pivot(3F, -7F, 0F));
		ModelPartData armLUpD = armLD.addChild("arm_l_up", ModelPartBuilder.create().uv(24, 0).cuboid(-1.5F, -8F, -1.5F, 3F, 8F, 3F), ModelTransform.of(4.5F, 0F, 0F, -0.25F, 0F, 0F));
		ModelPartData footLD = r.addChild("foot_l", ModelPartBuilder.create().uv(48, 0).cuboid(-2F, 0F, -2F, 4F, 2F, 4F), ModelTransform.pivot(2F, 22F, 0F));
		ModelPartData armRD = trunkD.addChild("arm_r", ModelPartBuilder.create().uv(28, 22).cuboid(-3F, -1.5F, -1.5F, 3F, 3F, 3F), ModelTransform.pivot(-3F, -7F, 0F));
		ModelPartData armRUpD = armRD.addChild("arm_r_up", ModelPartBuilder.create().uv(36, 0).cuboid(-1.5F, -8F, -1.5F, 3F, 8F, 3F), ModelTransform.of(-4.5F, 0F, 0F, -0.25F, 0F, 0F));
		ModelPartData footRD = r.addChild("foot_r", ModelPartBuilder.create().uv(0, 22).cuboid(-2F, 0F, -2F, 4F, 2F, 4F), ModelTransform.pivot(-2F, 22F, 0F));
		return TexturedModelData.of(data, 64, 64);
	}

	@Override
	public void setAngles(DesertCreeperEntity e, float limbAngle, float limbDistance, float age, float headYaw, float headPitch) {
		this.root.traverse().forEach(ModelPart::resetTransform);
		trunk.yaw += headYaw * MathHelper.RADIANS_PER_DEGREE * 0.4f;
		trunk.pitch += headPitch * MathHelper.RADIANS_PER_DEGREE * 0.25f;
		// семенящий шаг лапами, ствол раскачивается
		float swing = MathHelper.cos(limbAngle * 0.9f) * 1.0f * limbDistance;
		footL.pitch = swing;
		footR.pitch = -swing;
		trunk.roll += MathHelper.cos(limbAngle * 0.9f) * 0.08f * limbDistance;
		// руки подняты, как когтистые ветви; подрагивают
		float tremble = MathHelper.sin(age * 0.5f) * 0.05f;
		armL.roll += 0.1f + tremble;
		armR.roll -= 0.1f + tremble;
		armLUp.roll += tremble;
		armRUp.roll -= tremble;
		if (e.isAttacking() || e.getFuseSpeed() > 0) {
			armLUp.pitch -= 0.5f;
			armRUp.pitch -= 0.5f;
		}
	}

	@Override
	public ModelPart getPart() {
		return root;
	}
}
