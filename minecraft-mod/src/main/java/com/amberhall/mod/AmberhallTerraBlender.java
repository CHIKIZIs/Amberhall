package com.amberhall.mod;

import terrablender.api.Regions;
import terrablender.api.SurfaceRuleManager;
import terrablender.api.TerraBlenderApi;

public class AmberhallTerraBlender implements TerraBlenderApi {
	@Override
	public void onTerraBlenderInitialized() {
		// вес 1 против 10 у ванильного региона: чаща редкая
		Regions.register(new GlowRegion(AmberhallMod.id("overworld"), 1));
		SurfaceRuleManager.addSurfaceRules(SurfaceRuleManager.RuleCategory.OVERWORLD, AmberhallMod.MOD_ID, GlowSurfaceRules.make());
	}
}
