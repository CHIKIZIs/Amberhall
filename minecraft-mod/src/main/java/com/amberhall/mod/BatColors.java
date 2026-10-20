package com.amberhall.mod;

import java.util.Random;

import net.minecraft.entity.passive.BatEntity;
import net.minecraft.util.Identifier;

/** Расцветки летучих мышей: у каждой мыши свой цвет, закреплённый за её UUID (поэтому не мигает). Биом значения не имеет. */
public final class BatColors {
	private static final String[] SKINS = {"classic", "shadow", "albino", "crimson", "ocean", "forest", "amber", "violet", "cherry", "frost"};
	private static final int[] WEIGHTS = {16, 12, 8, 12, 12, 12, 10, 10, 8, 10};

	private BatColors() {
	}

	public static Identifier texture(BatEntity bat) {
		Random rng = new Random(bat.getUuid().getLeastSignificantBits() ^ bat.getUuid().getMostSignificantBits());
		int total = 0;
		for (int w : WEIGHTS) total += w;
		int pick = rng.nextInt(total);
		for (int i = 0; i < SKINS.length; i++) {
			pick -= WEIGHTS[i];
			if (pick < 0) return AmberhallMod.id("textures/entity/bat/" + SKINS[i] + ".png");
		}
		return AmberhallMod.id("textures/entity/bat/classic.png");
	}
}
