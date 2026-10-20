package com.dread;

import net.minecraft.client.model.ModelData;
import net.minecraft.client.model.ModelPart;
import net.minecraft.client.model.ModelPartBuilder;
import net.minecraft.client.model.ModelPartData;
import net.minecraft.client.model.ModelTransform;
import net.minecraft.client.model.TexturedModelData;
import net.minecraft.client.render.entity.model.EntityModelLayer;
import net.minecraft.client.render.entity.model.SinglePartEntityModel;
import net.minecraft.util.math.MathHelper;

/** Ползун: ходит на четвереньках, голова вывернута вверх тормашками, конечности как у паука. */
public class CrawlerModel extends SinglePartEntityModel<CrawlerEntity> {
	public static final EntityModelLayer LAYER = new EntityModelLayer(DreadMod.id("crawler"), "main");
	private final ModelPart root, head;
	private final ModelPart[] upper = new ModelPart[4];
	private static final String[] LIMBS = {"fl", "fr", "bl", "br"};

	public CrawlerModel(ModelPart root) {
		this.root = root;
		ModelPart body = root.getChild("body");
		this.head = body.getChild("head");
		for (int i = 0; i < 4; i++) upper[i] = body.getChild("upper_" + LIMBS[i]);
	}

	public static TexturedModelData getTexturedModelData() {
		ModelData data = new ModelData();
		ModelPartData r = data.getRoot();
		ModelPartData body = r.addChild("body", ModelPartBuilder.create().uv(0, 0).cuboid(-3F, -2F, -6F, 6F, 4F, 12F), ModelTransform.pivot(0F, 13F, 0F));
		body.addChild("head", ModelPartBuilder.create().uv(0, 16).cuboid(-3F, -3F, -3F, 6F, 6F, 6F), ModelTransform.of(0F, -1F, -8.5F, 0F, 0F, 3.14159F));
		float[][] pos = {{3F, 0F, -4F}, {-3F, 0F, -4F}, {3F, 0F, 4F}, {-3F, 0F, 4F}};
		for (int i = 0; i < 4; i++) {
			float side = pos[i][0] > 0 ? 1 : -1;
			ModelPartData up = body.addChild("upper_" + LIMBS[i], ModelPartBuilder.create().uv(24, 16).cuboid(-1F, 0F, -1F, 2F, 8F, 2F),
				ModelTransform.of(pos[i][0], pos[i][1], pos[i][2], 0F, 0F, -1.2F * side));
			up.addChild("lower", ModelPartBuilder.create().uv(32, 16).cuboid(-1F, 0F, -1F, 2F, 8F, 2F), ModelTransform.of(0F, 8F, 0F, 0F, 0F, 1.2F * side));
		}
		return TexturedModelData.of(data, 64, 64);
	}

	@Override
	public void setAngles(CrawlerEntity e, float limbAngle, float limbDistance, float age, float headYaw, float headPitch) {
		this.root.traverse().forEach(ModelPart::resetTransform);
		// голова дёргается и поворачивается, как будто шея сломана
		this.head.yaw += MathHelper.sin(age * 0.23f) * 0.35f + headYaw * MathHelper.RADIANS_PER_DEGREE * 0.5f;
		this.head.pitch += MathHelper.sin(age * 0.41f) * 0.12f;
		// паучья походка: пары конечностей работают в противофазе, лапы быстро и неровно переступают
		float swing = MathHelper.cos(limbAngle * 1.1f) * 0.9f * limbDistance;
		upper[0].pitch += swing;
		upper[3].pitch += swing;
		upper[1].pitch -= swing;
		upper[2].pitch -= swing;
	}

	@Override
	public ModelPart getPart() {
		return root;
	}
}
