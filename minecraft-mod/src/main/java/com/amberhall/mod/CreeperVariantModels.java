package com.amberhall.mod;

import net.minecraft.client.model.ModelData;
import net.minecraft.client.model.ModelPartBuilder;
import net.minecraft.client.model.ModelPartData;
import net.minecraft.client.model.ModelTransform;
import net.minecraft.client.model.TexturedModelData;

/** Данные моделей биомных криперов. Генерируется tools/creeper_variants.py — вручную не править. */
public final class CreeperVariantModels {
	private CreeperVariantModels() {
	}

	public static TexturedModelData get(String variant) {
		return switch (variant) {
			case "swamp" -> swamp();
			case "jungle" -> jungle();
			case "mushroom" -> mushroom();
			case "badlands" -> badlands();
			case "cave" -> cave();
			case "meadow" -> meadow();
			case "darkforest" -> darkforest();
			default -> throw new IllegalArgumentException(variant);
		};
	}

	private static TexturedModelData swamp() {
		ModelData data = new ModelData();
		ModelPartData r = data.getRoot();
		ModelPartData bodyD = r.addChild("body", ModelPartBuilder.create().uv(64, 0).cuboid(-4F, -12F, -2.5F, 8F, 12F, 5F), ModelTransform.of(0F, 17F, 1F, 0.45F, 0F, 0F));
		ModelPartData headD = bodyD.addChild("head", ModelPartBuilder.create().uv(90, 0).cuboid(-4F, -8F, -4F, 8F, 8F, 8F), ModelTransform.of(0F, -11F, 0F, -0.3375F, 0F, 0F));
		ModelPartData legFlD = r.addChild("leg_fl", ModelPartBuilder.create().uv(48, 17).cuboid(-2F, 0F, -2F, 4F, 5F, 4F), ModelTransform.of(2.6F, 17F, -2.5F, -0.3F, 0F, 0.12F));
		ModelPartData legFlFootD = legFlD.addChild("leg_fl_foot", ModelPartBuilder.create().uv(0, 31).cuboid(-2.5F, 0F, -3.5F, 5F, 2F, 6F), ModelTransform.of(0F, 5F, 0F, 0.27F, 0F, 0F));
		ModelPartData legFrD = r.addChild("leg_fr", ModelPartBuilder.create().uv(64, 17).cuboid(-2F, 0F, -2F, 4F, 5F, 4F), ModelTransform.of(-2.6F, 17F, -2.5F, -0.3F, 0F, -0.12F));
		ModelPartData legFrFootD = legFrD.addChild("leg_fr_foot", ModelPartBuilder.create().uv(22, 31).cuboid(-2.5F, 0F, -3.5F, 5F, 2F, 6F), ModelTransform.of(0F, 5F, 0F, 0.27F, 0F, 0F));
		ModelPartData legBlD = r.addChild("leg_bl", ModelPartBuilder.create().uv(80, 17).cuboid(-2F, 0F, -2F, 4F, 5F, 4F), ModelTransform.of(2.6F, 17F, 4.5F, 0.3F, 0F, 0.1F));
		ModelPartData legBlFootD = legBlD.addChild("leg_bl_foot", ModelPartBuilder.create().uv(44, 31).cuboid(-2.5F, 0F, -3.5F, 5F, 2F, 6F), ModelTransform.of(0F, 5F, 0F, -0.27F, 0F, 0F));
		ModelPartData legBrD = r.addChild("leg_br", ModelPartBuilder.create().uv(96, 17).cuboid(-2F, 0F, -2F, 4F, 5F, 4F), ModelTransform.of(-2.6F, 17F, 4.5F, 0.3F, 0F, -0.1F));
		ModelPartData legBrFootD = legBrD.addChild("leg_br_foot", ModelPartBuilder.create().uv(66, 31).cuboid(-2.5F, 0F, -3.5F, 5F, 2F, 6F), ModelTransform.of(0F, 5F, 0F, -0.27F, 0F, 0F));
		ModelPartData hatBrimD = headD.addChild("hat_brim", ModelPartBuilder.create().uv(0, 0).cuboid(-8F, -1F, -8F, 16F, 1F, 16F), ModelTransform.of(0F, -7F, 0F, 0.05F, 0F, 0F));
		ModelPartData hatCrownD = headD.addChild("hat_crown", ModelPartBuilder.create().uv(16, 17).cuboid(-4F, -3F, -4F, 8F, 3F, 8F), ModelTransform.pivot(0F, -8F, 0F));
		ModelPartData grass0D = headD.addChild("grass_0", ModelPartBuilder.create().uv(120, 31).cuboid(-0.5F, -5F, -0.5F, 1F, 5F, 1F), ModelTransform.of(-2.09628F, -11F, 0.353834F, 0.291161F, 2.97706F, 0.0565965F));
		ModelPartData grass1D = headD.addChild("grass_1", ModelPartBuilder.create().uv(88, 31).cuboid(-0.5F, -6F, -0.5F, 1F, 6F, 1F), ModelTransform.of(0.844796F, -11F, 3.27055F, -0.168452F, 1.4716F, 0.346951F));
		ModelPartData grass2D = headD.addChild("grass_2", ModelPartBuilder.create().uv(92, 31).cuboid(-0.5F, -6F, -0.5F, 1F, 6F, 1F), ModelTransform.of(-0.237892F, -11F, 2.69169F, -0.0720058F, 5.40722F, -0.187655F));
		ModelPartData grass3D = headD.addChild("grass_3", ModelPartBuilder.create().uv(96, 31).cuboid(-0.5F, -6F, -0.5F, 1F, 6F, 1F), ModelTransform.of(-2.78702F, -11F, 3.40668F, 0.168876F, 4.21646F, -0.305178F));
		ModelPartData grass4D = headD.addChild("grass_4", ModelPartBuilder.create().uv(124, 31).cuboid(-0.5F, -5F, -0.5F, 1F, 5F, 1F), ModelTransform.of(2.06584F, -11F, 0.728797F, 0.196054F, 5.17202F, -0.161398F));
		ModelPartData grass5D = headD.addChild("grass_5", ModelPartBuilder.create().uv(100, 31).cuboid(-0.5F, -6F, -0.5F, 1F, 6F, 1F), ModelTransform.of(0.757996F, -11F, 3.36125F, 0.149891F, 5.7845F, -0.0735256F));
		ModelPartData grass6D = headD.addChild("grass_6", ModelPartBuilder.create().uv(4, 39).cuboid(-0.5F, -4F, -0.5F, 1F, 4F, 1F), ModelTransform.of(2.40727F, -11F, -0.443032F, 0.265207F, 0.612013F, -0.254822F));
		ModelPartData grass7D = headD.addChild("grass_7", ModelPartBuilder.create().uv(104, 31).cuboid(-0.5F, -6F, -0.5F, 1F, 6F, 1F), ModelTransform.of(-2.2641F, -11F, 3.72384F, 0.195281F, 5.37082F, -0.055196F));
		ModelPartData grass8D = headD.addChild("grass_8", ModelPartBuilder.create().uv(108, 31).cuboid(-0.5F, -6F, -0.5F, 1F, 6F, 1F), ModelTransform.of(2.66782F, -11F, 0.592182F, 0.0589763F, 5.67839F, 0.127387F));
		ModelPartData grass9D = headD.addChild("grass_9", ModelPartBuilder.create().uv(8, 39).cuboid(-0.5F, -4F, -0.5F, 1F, 4F, 1F), ModelTransform.of(3.43156F, -11F, 2.8512F, 0.139031F, 2.04973F, 0.0292362F));
		ModelPartData grass10D = headD.addChild("grass_10", ModelPartBuilder.create().uv(12, 39).cuboid(-0.5F, -4F, -0.5F, 1F, 4F, 1F), ModelTransform.of(0.575645F, -11F, -3.16739F, 0.0930831F, 6.20509F, -0.163041F));
		ModelPartData grass11D = headD.addChild("grass_11", ModelPartBuilder.create().uv(112, 31).cuboid(-0.5F, -6F, -0.5F, 1F, 6F, 1F), ModelTransform.of(-3.00452F, -11F, -0.143989F, -0.288037F, 5.02774F, -0.0626767F));
		ModelPartData grass12D = headD.addChild("grass_12", ModelPartBuilder.create().uv(116, 31).cuboid(-0.5F, -6F, -0.5F, 1F, 6F, 1F), ModelTransform.of(-2.79388F, -11F, -1.64887F, 0.260937F, 0.277514F, 0.0801728F));
		ModelPartData grass13D = headD.addChild("grass_13", ModelPartBuilder.create().uv(0, 39).cuboid(-0.5F, -5F, -0.5F, 1F, 5F, 1F), ModelTransform.of(-3.64048F, -11F, 1.74752F, 0.035596F, 5.78942F, -0.154649F));
		ModelPartData armLD = bodyD.addChild("arm_l", ModelPartBuilder.create().uv(0, 17).cuboid(0F, 0F, -1F, 2F, 12F, 2F), ModelTransform.of(4.5F, -10F, 0F, 0.3F, 0F, -0.1F));
		ModelPartData armRD = bodyD.addChild("arm_r", ModelPartBuilder.create().uv(8, 17).cuboid(-2F, 0F, -1F, 2F, 12F, 2F), ModelTransform.of(-4.5F, -10F, 0F, 0.3F, 0F, 0.1F));
		return TexturedModelData.of(data, 128, 128);
	}

	private static TexturedModelData jungle() {
		ModelData data = new ModelData();
		ModelPartData r = data.getRoot();
		ModelPartData bodyD = r.addChild("body", ModelPartBuilder.create().uv(0, 0).cuboid(-3F, -16F, -2.5F, 6F, 16F, 5F), ModelTransform.of(0F, 17F, 1F, 0.8F, 0F, 0F));
		ModelPartData headD = bodyD.addChild("head", ModelPartBuilder.create().uv(22, 0).cuboid(-5F, -6F, -4F, 10F, 6F, 8F), ModelTransform.of(0F, -15F, -1F, -0.6F, 0F, 0F));
		ModelPartData legFlD = r.addChild("leg_fl", ModelPartBuilder.create().uv(48, 21).cuboid(-2F, 0F, -2F, 4F, 5F, 4F), ModelTransform.of(1.6F, 17F, -2.5F, -0.3F, 0F, 0.12F));
		ModelPartData legFlFootD = legFlD.addChild("leg_fl_foot", ModelPartBuilder.create().uv(58, 0).cuboid(-2.5F, 0F, -4F, 5F, 2F, 7F), ModelTransform.of(0F, 5F, 0F, 0.27F, 0F, 0F));
		ModelPartData legFrD = r.addChild("leg_fr", ModelPartBuilder.create().uv(64, 21).cuboid(-2F, 0F, -2F, 4F, 5F, 4F), ModelTransform.of(-1.6F, 17F, -2.5F, -0.3F, 0F, -0.12F));
		ModelPartData legFrFootD = legFrD.addChild("leg_fr_foot", ModelPartBuilder.create().uv(82, 0).cuboid(-2.5F, 0F, -4F, 5F, 2F, 7F), ModelTransform.of(0F, 5F, 0F, 0.27F, 0F, 0F));
		ModelPartData legBlD = r.addChild("leg_bl", ModelPartBuilder.create().uv(80, 21).cuboid(-2F, 0F, -2F, 4F, 5F, 4F), ModelTransform.of(1.6F, 17F, 4.5F, 0.3F, 0F, 0.1F));
		ModelPartData legBlFootD = legBlD.addChild("leg_bl_foot", ModelPartBuilder.create().uv(0, 21).cuboid(-2.5F, 0F, -4F, 5F, 2F, 7F), ModelTransform.of(0F, 5F, 0F, -0.27F, 0F, 0F));
		ModelPartData legBrD = r.addChild("leg_br", ModelPartBuilder.create().uv(96, 21).cuboid(-2F, 0F, -2F, 4F, 5F, 4F), ModelTransform.of(-1.6F, 17F, 4.5F, 0.3F, 0F, -0.1F));
		ModelPartData legBrFootD = legBrD.addChild("leg_br_foot", ModelPartBuilder.create().uv(24, 21).cuboid(-2.5F, 0F, -4F, 5F, 2F, 7F), ModelTransform.of(0F, 5F, 0F, -0.27F, 0F, 0F));
		ModelPartData leafLD = headD.addChild("leaf_l", ModelPartBuilder.create().uv(24, 30).cuboid(0F, -1F, -3F, 5F, 1F, 6F), ModelTransform.of(3F, -6F, 0F, 0F, 0F, 0.6F));
		ModelPartData leafRD = headD.addChild("leaf_r", ModelPartBuilder.create().uv(46, 30).cuboid(-5F, -1F, -3F, 5F, 1F, 6F), ModelTransform.of(-3F, -6F, 0F, 0F, 0F, -0.6F));
		ModelPartData leafCD = headD.addChild("leaf_c", ModelPartBuilder.create().uv(0, 30).cuboid(-3F, -1F, -3F, 6F, 1F, 6F), ModelTransform.of(0F, -6F, 0F, -0.3F, 0F, 0F));
		return TexturedModelData.of(data, 128, 128);
	}

	private static TexturedModelData mushroom() {
		ModelData data = new ModelData();
		ModelPartData r = data.getRoot();
		ModelPartData bodyD = r.addChild("body", ModelPartBuilder.create().uv(96, 0).cuboid(-4F, -12F, -2F, 8F, 12F, 4F), ModelTransform.of(0F, 17F, 1F, 0.35F, 0F, 0F));
		ModelPartData headD = bodyD.addChild("head", ModelPartBuilder.create().uv(64, 0).cuboid(-4F, -8F, -4F, 8F, 8F, 8F), ModelTransform.of(0F, -11F, 0F, -0.2625F, 0F, 0F));
		ModelPartData legFlD = r.addChild("leg_fl", ModelPartBuilder.create().uv(48, 19).cuboid(-2F, 0F, -2F, 4F, 5F, 4F), ModelTransform.of(2.6F, 17F, -2.5F, -0.3F, 0F, 0.12F));
		ModelPartData legFlFootD = legFlD.addChild("leg_fl_foot", ModelPartBuilder.create().uv(0, 33).cuboid(-2.5F, 0F, -3.5F, 5F, 2F, 6F), ModelTransform.of(0F, 5F, 0F, 0.27F, 0F, 0F));
		ModelPartData legFrD = r.addChild("leg_fr", ModelPartBuilder.create().uv(64, 19).cuboid(-2F, 0F, -2F, 4F, 5F, 4F), ModelTransform.of(-2.6F, 17F, -2.5F, -0.3F, 0F, -0.12F));
		ModelPartData legFrFootD = legFrD.addChild("leg_fr_foot", ModelPartBuilder.create().uv(22, 33).cuboid(-2.5F, 0F, -3.5F, 5F, 2F, 6F), ModelTransform.of(0F, 5F, 0F, 0.27F, 0F, 0F));
		ModelPartData legBlD = r.addChild("leg_bl", ModelPartBuilder.create().uv(80, 19).cuboid(-2F, 0F, -2F, 4F, 5F, 4F), ModelTransform.of(2.6F, 17F, 4.5F, 0.3F, 0F, 0.1F));
		ModelPartData legBlFootD = legBlD.addChild("leg_bl_foot", ModelPartBuilder.create().uv(44, 33).cuboid(-2.5F, 0F, -3.5F, 5F, 2F, 6F), ModelTransform.of(0F, 5F, 0F, -0.27F, 0F, 0F));
		ModelPartData legBrD = r.addChild("leg_br", ModelPartBuilder.create().uv(96, 19).cuboid(-2F, 0F, -2F, 4F, 5F, 4F), ModelTransform.of(-2.6F, 17F, 4.5F, 0.3F, 0F, -0.1F));
		ModelPartData legBrFootD = legBrD.addChild("leg_br_foot", ModelPartBuilder.create().uv(66, 33).cuboid(-2.5F, 0F, -3.5F, 5F, 2F, 6F), ModelTransform.of(0F, 5F, 0F, -0.27F, 0F, 0F));
		ModelPartData capD = headD.addChild("cap", ModelPartBuilder.create().uv(0, 0).cuboid(-8F, -3F, -8F, 16F, 3F, 16F), ModelTransform.pivot(0F, -7F, 0F));
		ModelPartData capTopD = headD.addChild("cap_top", ModelPartBuilder.create().uv(0, 19).cuboid(-6F, -2F, -6F, 12F, 2F, 12F), ModelTransform.pivot(0F, -10F, 0F));
		ModelPartData capPeakD = headD.addChild("cap_peak", ModelPartBuilder.create().uv(88, 33).cuboid(-3F, -1F, -3F, 6F, 1F, 6F), ModelTransform.pivot(0F, -12F, 0F));
		return TexturedModelData.of(data, 128, 128);
	}

	private static TexturedModelData badlands() {
		ModelData data = new ModelData();
		ModelPartData r = data.getRoot();
		ModelPartData bodyD = r.addChild("body", ModelPartBuilder.create().uv(0, 0).cuboid(-4F, -16F, -2.5F, 8F, 16F, 5F), ModelTransform.of(0F, 15F, 1F, 0.25F, 0F, 0F));
		ModelPartData headD = bodyD.addChild("head", ModelPartBuilder.create().uv(26, 0).cuboid(-4.5F, -10F, -4.5F, 9F, 10F, 9F), ModelTransform.of(0F, -15F, 0F, -0.1875F, 0F, 0F));
		ModelPartData legFlD = r.addChild("leg_fl", ModelPartBuilder.create().uv(62, 0).cuboid(-2F, 0F, -2F, 4F, 7F, 4F), ModelTransform.of(2.6F, 15F, -2.5F, -0.3F, 0F, 0.12F));
		ModelPartData legFlFootD = legFlD.addChild("leg_fl_foot", ModelPartBuilder.create().uv(24, 21).cuboid(-2.5F, 0F, -3.5F, 5F, 2F, 6F), ModelTransform.of(0F, 7F, 0F, 0.27F, 0F, 0F));
		ModelPartData legFrD = r.addChild("leg_fr", ModelPartBuilder.create().uv(78, 0).cuboid(-2F, 0F, -2F, 4F, 7F, 4F), ModelTransform.of(-2.6F, 15F, -2.5F, -0.3F, 0F, -0.12F));
		ModelPartData legFrFootD = legFrD.addChild("leg_fr_foot", ModelPartBuilder.create().uv(46, 21).cuboid(-2.5F, 0F, -3.5F, 5F, 2F, 6F), ModelTransform.of(0F, 7F, 0F, 0.27F, 0F, 0F));
		ModelPartData legBlD = r.addChild("leg_bl", ModelPartBuilder.create().uv(94, 0).cuboid(-2F, 0F, -2F, 4F, 7F, 4F), ModelTransform.of(2.6F, 15F, 4.5F, 0.3F, 0F, 0.1F));
		ModelPartData legBlFootD = legBlD.addChild("leg_bl_foot", ModelPartBuilder.create().uv(68, 21).cuboid(-2.5F, 0F, -3.5F, 5F, 2F, 6F), ModelTransform.of(0F, 7F, 0F, -0.27F, 0F, 0F));
		ModelPartData legBrD = r.addChild("leg_br", ModelPartBuilder.create().uv(110, 0).cuboid(-2F, 0F, -2F, 4F, 7F, 4F), ModelTransform.of(-2.6F, 15F, 4.5F, 0.3F, 0F, -0.1F));
		ModelPartData legBrFootD = legBrD.addChild("leg_br_foot", ModelPartBuilder.create().uv(90, 21).cuboid(-2.5F, 0F, -3.5F, 5F, 2F, 6F), ModelTransform.of(0F, 7F, 0F, -0.27F, 0F, 0F));
		ModelPartData topD = headD.addChild("top", ModelPartBuilder.create().uv(0, 21).cuboid(-3F, -2F, -3F, 6F, 2F, 6F), ModelTransform.pivot(0F, -10F, 0F));
		return TexturedModelData.of(data, 128, 128);
	}

	private static TexturedModelData cave() {
		ModelData data = new ModelData();
		ModelPartData r = data.getRoot();
		ModelPartData bodyD = r.addChild("body", ModelPartBuilder.create().uv(0, 0).cuboid(-5.5F, -12F, -3.5F, 11F, 12F, 7F), ModelTransform.of(0F, 17F, 1F, 0.4F, 0F, 0F));
		ModelPartData headD = bodyD.addChild("head", ModelPartBuilder.create().uv(36, 0).cuboid(-5.5F, -8F, -4.5F, 11F, 8F, 9F), ModelTransform.of(0F, -11F, 0F, -0.3F, 0F, 0F));
		ModelPartData legFlD = r.addChild("leg_fl", ModelPartBuilder.create().uv(76, 0).cuboid(-2.5F, 0F, -2.5F, 5F, 5F, 5F), ModelTransform.of(3.6F, 17F, -3F, -0.3F, 0F, 0.12F));
		ModelPartData legFlFootD = legFlD.addChild("leg_fl_foot", ModelPartBuilder.create().uv(40, 19).cuboid(-3F, 0F, -4F, 6F, 2F, 7F), ModelTransform.of(0F, 5F, 0F, 0.27F, 0F, 0F));
		ModelPartData legFrD = r.addChild("leg_fr", ModelPartBuilder.create().uv(96, 0).cuboid(-2.5F, 0F, -2.5F, 5F, 5F, 5F), ModelTransform.of(-3.6F, 17F, -3F, -0.3F, 0F, -0.12F));
		ModelPartData legFrFootD = legFrD.addChild("leg_fr_foot", ModelPartBuilder.create().uv(66, 19).cuboid(-3F, 0F, -4F, 6F, 2F, 7F), ModelTransform.of(0F, 5F, 0F, 0.27F, 0F, 0F));
		ModelPartData legBlD = r.addChild("leg_bl", ModelPartBuilder.create().uv(0, 19).cuboid(-2.5F, 0F, -2.5F, 5F, 5F, 5F), ModelTransform.of(3.6F, 17F, 5F, 0.3F, 0F, 0.1F));
		ModelPartData legBlFootD = legBlD.addChild("leg_bl_foot", ModelPartBuilder.create().uv(92, 19).cuboid(-3F, 0F, -4F, 6F, 2F, 7F), ModelTransform.of(0F, 5F, 0F, -0.27F, 0F, 0F));
		ModelPartData legBrD = r.addChild("leg_br", ModelPartBuilder.create().uv(20, 19).cuboid(-2.5F, 0F, -2.5F, 5F, 5F, 5F), ModelTransform.of(-3.6F, 17F, 5F, 0.3F, 0F, -0.1F));
		ModelPartData legBrFootD = legBrD.addChild("leg_br_foot", ModelPartBuilder.create().uv(0, 29).cuboid(-3F, 0F, -4F, 6F, 2F, 7F), ModelTransform.of(0F, 5F, 0F, -0.27F, 0F, 0F));
		ModelPartData spikeAD = headD.addChild("spike_a", ModelPartBuilder.create().uv(26, 29).cuboid(-1F, -5F, -1F, 2F, 5F, 2F), ModelTransform.of(-3F, -8F, 0F, 0.1F, 0F, -0.3F));
		ModelPartData spikeBD = headD.addChild("spike_b", ModelPartBuilder.create().uv(56, 29).cuboid(-1F, -4F, -1F, 2F, 4F, 2F), ModelTransform.of(3F, -8F, -1F, -0.15F, 0F, 0.35F));
		ModelPartData spikeCD = headD.addChild("spike_c", ModelPartBuilder.create().uv(64, 29).cuboid(-1F, -3F, -1F, 2F, 3F, 2F), ModelTransform.of(0F, -8F, 2F, 0.3F, 0F, 0F));
		ModelPartData mossD = headD.addChild("moss", ModelPartBuilder.create().uv(34, 29).cuboid(-3F, -1F, -3F, 6F, 1F, 5F), ModelTransform.pivot(0F, -8F, 0F));
		return TexturedModelData.of(data, 128, 128);
	}

	private static TexturedModelData meadow() {
		ModelData data = new ModelData();
		ModelPartData r = data.getRoot();
		ModelPartData bodyD = r.addChild("body", ModelPartBuilder.create().uv(34, 0).cuboid(-4F, -12F, -2F, 8F, 12F, 4F), ModelTransform.of(0F, 17F, 1F, 0.5F, 0F, 0F));
		ModelPartData headD = bodyD.addChild("head", ModelPartBuilder.create().uv(0, 0).cuboid(-4.5F, -8F, -4F, 9F, 8F, 8F), ModelTransform.of(0F, -11F, 0F, -0.375F, 0F, 0F));
		ModelPartData legFlD = r.addChild("leg_fl", ModelPartBuilder.create().uv(58, 0).cuboid(-2F, 0F, -2F, 4F, 5F, 4F), ModelTransform.of(2.6F, 17F, -2.5F, -0.3F, 0F, 0.12F));
		ModelPartData legFlFootD = legFlD.addChild("leg_fl_foot", ModelPartBuilder.create().uv(0, 16).cuboid(-2.5F, 0F, -3.5F, 5F, 2F, 6F), ModelTransform.of(0F, 5F, 0F, 0.27F, 0F, 0F));
		ModelPartData legFrD = r.addChild("leg_fr", ModelPartBuilder.create().uv(74, 0).cuboid(-2F, 0F, -2F, 4F, 5F, 4F), ModelTransform.of(-2.6F, 17F, -2.5F, -0.3F, 0F, -0.12F));
		ModelPartData legFrFootD = legFrD.addChild("leg_fr_foot", ModelPartBuilder.create().uv(22, 16).cuboid(-2.5F, 0F, -3.5F, 5F, 2F, 6F), ModelTransform.of(0F, 5F, 0F, 0.27F, 0F, 0F));
		ModelPartData legBlD = r.addChild("leg_bl", ModelPartBuilder.create().uv(90, 0).cuboid(-2F, 0F, -2F, 4F, 5F, 4F), ModelTransform.of(2.6F, 17F, 4.5F, 0.3F, 0F, 0.1F));
		ModelPartData legBlFootD = legBlD.addChild("leg_bl_foot", ModelPartBuilder.create().uv(44, 16).cuboid(-2.5F, 0F, -3.5F, 5F, 2F, 6F), ModelTransform.of(0F, 5F, 0F, -0.27F, 0F, 0F));
		ModelPartData legBrD = r.addChild("leg_br", ModelPartBuilder.create().uv(106, 0).cuboid(-2F, 0F, -2F, 4F, 5F, 4F), ModelTransform.of(-2.6F, 17F, 4.5F, 0.3F, 0F, -0.1F));
		ModelPartData legBrFootD = legBrD.addChild("leg_br_foot", ModelPartBuilder.create().uv(66, 16).cuboid(-2.5F, 0F, -3.5F, 5F, 2F, 6F), ModelTransform.of(0F, 5F, 0F, -0.27F, 0F, 0F));
		ModelPartData grass0D = headD.addChild("grass_0", ModelPartBuilder.create().uv(24, 24).cuboid(-0.5F, -3F, -0.5F, 1F, 3F, 1F), ModelTransform.of(-0.333343F, -8F, 0.418407F, -0.0337174F, 5.36969F, -0.217069F));
		ModelPartData grass1D = headD.addChild("grass_1", ModelPartBuilder.create().uv(92, 16).cuboid(-0.5F, -4F, -0.5F, 1F, 4F, 1F), ModelTransform.of(2.1273F, -8F, -0.169657F, 0.205084F, 0.591095F, -0.137619F));
		ModelPartData grass2D = headD.addChild("grass_2", ModelPartBuilder.create().uv(96, 16).cuboid(-0.5F, -4F, -0.5F, 1F, 4F, 1F), ModelTransform.of(-2.86531F, -8F, 2.16751F, 0.0941169F, 3.73934F, -0.072688F));
		ModelPartData grass3D = headD.addChild("grass_3", ModelPartBuilder.create().uv(100, 16).cuboid(-0.5F, -4F, -0.5F, 1F, 4F, 1F), ModelTransform.of(-0.329036F, -8F, 1.67241F, -0.239754F, 0.0942046F, 0.0198669F));
		ModelPartData grass4D = headD.addChild("grass_4", ModelPartBuilder.create().uv(40, 24).cuboid(-0.5F, -2F, -0.5F, 1F, 2F, 1F), ModelTransform.of(-3.08314F, -8F, -2.16854F, 0.0697327F, 4.88652F, -0.121595F));
		ModelPartData grass5D = headD.addChild("grass_5", ModelPartBuilder.create().uv(44, 24).cuboid(-0.5F, -2F, -0.5F, 1F, 2F, 1F), ModelTransform.of(0.636716F, -8F, -2.13275F, 0.0982042F, 3.13858F, 0.113715F));
		ModelPartData grass6D = headD.addChild("grass_6", ModelPartBuilder.create().uv(104, 16).cuboid(-0.5F, -4F, -0.5F, 1F, 4F, 1F), ModelTransform.of(-0.298691F, -8F, -1.55286F, 0.346984F, 5.27655F, 0.145467F));
		ModelPartData grass7D = headD.addChild("grass_7", ModelPartBuilder.create().uv(28, 24).cuboid(-0.5F, -3F, -0.5F, 1F, 3F, 1F), ModelTransform.of(-1.29306F, -8F, -1.89234F, -0.329174F, 3.53653F, -0.274451F));
		ModelPartData grass8D = headD.addChild("grass_8", ModelPartBuilder.create().uv(48, 24).cuboid(-0.5F, -2F, -0.5F, 1F, 2F, 1F), ModelTransform.of(-2.74538F, -8F, -1.46368F, 0.32063F, 5.32111F, -0.349619F));
		ModelPartData grass9D = headD.addChild("grass_9", ModelPartBuilder.create().uv(32, 24).cuboid(-0.5F, -3F, -0.5F, 1F, 3F, 1F), ModelTransform.of(-2.03198F, -8F, 2.8719F, -0.0871758F, 4.45189F, -0.056146F));
		ModelPartData grass10D = headD.addChild("grass_10", ModelPartBuilder.create().uv(108, 16).cuboid(-0.5F, -4F, -0.5F, 1F, 4F, 1F), ModelTransform.of(0.463692F, -8F, -2.11057F, -0.161157F, 0.547266F, -0.11719F));
		ModelPartData grass11D = headD.addChild("grass_11", ModelPartBuilder.create().uv(52, 24).cuboid(-0.5F, -2F, -0.5F, 1F, 2F, 1F), ModelTransform.of(3.24853F, -8F, 1.80628F, -0.255782F, 4.44006F, -0.342331F));
		ModelPartData stemAD = headD.addChild("stem_a", ModelPartBuilder.create().uv(112, 16).cuboid(-0.5F, -4F, -0.5F, 1F, 4F, 1F), ModelTransform.of(-2.5F, -8F, -1F, 0F, 0F, -0.15F));
		ModelPartData bloomAD = stemAD.addChild("bloom_a", ModelPartBuilder.create().uv(116, 16).cuboid(-1.5F, -1F, -1.5F, 3F, 1F, 3F), ModelTransform.pivot(0F, -4F, 0F));
		ModelPartData stemBD = headD.addChild("stem_b", ModelPartBuilder.create().uv(88, 16).cuboid(-0.5F, -5F, -0.5F, 1F, 5F, 1F), ModelTransform.of(2.5F, -8F, 1F, 0F, 0F, 0.2F));
		ModelPartData bloomBD = stemBD.addChild("bloom_b", ModelPartBuilder.create().uv(0, 24).cuboid(-1.5F, -1F, -1.5F, 3F, 1F, 3F), ModelTransform.pivot(0F, -5F, 0F));
		ModelPartData stemCD = headD.addChild("stem_c", ModelPartBuilder.create().uv(36, 24).cuboid(-0.5F, -3F, -0.5F, 1F, 3F, 1F), ModelTransform.of(0F, -8F, -2F, -0.2F, 0F, 0F));
		ModelPartData bloomCD = stemCD.addChild("bloom_c", ModelPartBuilder.create().uv(12, 24).cuboid(-1.5F, -1F, -1.5F, 3F, 1F, 3F), ModelTransform.pivot(0F, -3F, 0F));
		return TexturedModelData.of(data, 128, 128);
	}

	private static TexturedModelData darkforest() {
		ModelData data = new ModelData();
		ModelPartData r = data.getRoot();
		ModelPartData bodyD = r.addChild("body", ModelPartBuilder.create().uv(36, 0).cuboid(-4F, -11F, -2.5F, 8F, 11F, 5F), ModelTransform.of(0F, 17F, 1F, 0.6F, 0F, 0F));
		ModelPartData headD = bodyD.addChild("head", ModelPartBuilder.create().uv(0, 0).cuboid(-4.5F, -9F, -4.5F, 9F, 9F, 9F), ModelTransform.of(0F, -10F, 0F, -0.45F, 0F, 0F));
		ModelPartData legFlD = r.addChild("leg_fl", ModelPartBuilder.create().uv(62, 0).cuboid(-2F, 0F, -2F, 4F, 5F, 4F), ModelTransform.of(2.6F, 17F, -2.5F, -0.3F, 0F, 0.12F));
		ModelPartData legFlFootD = legFlD.addChild("leg_fl_foot", ModelPartBuilder.create().uv(0, 18).cuboid(-2.5F, 0F, -3.5F, 5F, 2F, 6F), ModelTransform.of(0F, 5F, 0F, 0.27F, 0F, 0F));
		ModelPartData legFrD = r.addChild("leg_fr", ModelPartBuilder.create().uv(78, 0).cuboid(-2F, 0F, -2F, 4F, 5F, 4F), ModelTransform.of(-2.6F, 17F, -2.5F, -0.3F, 0F, -0.12F));
		ModelPartData legFrFootD = legFrD.addChild("leg_fr_foot", ModelPartBuilder.create().uv(22, 18).cuboid(-2.5F, 0F, -3.5F, 5F, 2F, 6F), ModelTransform.of(0F, 5F, 0F, 0.27F, 0F, 0F));
		ModelPartData legBlD = r.addChild("leg_bl", ModelPartBuilder.create().uv(94, 0).cuboid(-2F, 0F, -2F, 4F, 5F, 4F), ModelTransform.of(2.6F, 17F, 4.5F, 0.3F, 0F, 0.1F));
		ModelPartData legBlFootD = legBlD.addChild("leg_bl_foot", ModelPartBuilder.create().uv(44, 18).cuboid(-2.5F, 0F, -3.5F, 5F, 2F, 6F), ModelTransform.of(0F, 5F, 0F, -0.27F, 0F, 0F));
		ModelPartData legBrD = r.addChild("leg_br", ModelPartBuilder.create().uv(110, 0).cuboid(-2F, 0F, -2F, 4F, 5F, 4F), ModelTransform.of(-2.6F, 17F, 4.5F, 0.3F, 0F, -0.1F));
		ModelPartData legBrFootD = legBrD.addChild("leg_br_foot", ModelPartBuilder.create().uv(66, 18).cuboid(-2.5F, 0F, -3.5F, 5F, 2F, 6F), ModelTransform.of(0F, 5F, 0F, -0.27F, 0F, 0F));
		ModelPartData shroomAD = headD.addChild("shroom_a", ModelPartBuilder.create().uv(16, 26).cuboid(-0.5F, -2F, -0.5F, 1F, 2F, 1F), ModelTransform.of(-2F, -9F, -1F, 0F, 0F, -0.2F));
		ModelPartData shroomACapD = shroomAD.addChild("shroom_a_cap", ModelPartBuilder.create().uv(88, 18).cuboid(-2F, -1F, -2F, 4F, 1F, 4F), ModelTransform.pivot(0F, -2F, 0F));
		ModelPartData shroomBD = headD.addChild("shroom_b", ModelPartBuilder.create().uv(12, 26).cuboid(-0.5F, -3F, -0.5F, 1F, 3F, 1F), ModelTransform.of(2F, -9F, 2F, 0F, 0F, 0.25F));
		ModelPartData shroomBCapD = shroomBD.addChild("shroom_b_cap", ModelPartBuilder.create().uv(104, 18).cuboid(-2F, -1F, -2F, 4F, 1F, 4F), ModelTransform.pivot(0F, -3F, 0F));
		ModelPartData shroomCD = headD.addChild("shroom_c", ModelPartBuilder.create().uv(20, 26).cuboid(-0.5F, -2F, -0.5F, 1F, 2F, 1F), ModelTransform.of(0F, -9F, -3F, -0.2F, 0F, 0F));
		ModelPartData shroomCCapD = shroomCD.addChild("shroom_c_cap", ModelPartBuilder.create().uv(0, 26).cuboid(-1.5F, -1F, -1.5F, 3F, 1F, 3F), ModelTransform.pivot(0F, -2F, 0F));
		return TexturedModelData.of(data, 128, 128);
	}
}
